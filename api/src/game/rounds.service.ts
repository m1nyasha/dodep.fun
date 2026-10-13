import {
  multiplier,
  payout,
  SAFE,
  type ActiveRoundResponseDto,
  type FeedEventDto,
  type FinishedRoundDto,
  type RoundResponseDto,
  type RoundsPageDto,
} from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { apiError } from '../common/api-error.js';
import { DB, type Db, type Tx } from '../db/db.module.js';
import { isDuplicateKey } from '../db/errors.js';
import { ledger, newId, roundActions, rounds, users, type RoundRow, type RuleRow, type UserRow } from '../db/schema.js';
import { FeedGateway } from '../feed/feed.gateway.js';
import { layoutHash, newSalt } from './engine/board.js';
import { MINE_SOURCE, type MineSource } from './mine-source.js';
import { RulesService } from './rules.service.js';
import { toRoundDto } from './rounds.mapper.js';

type Outcome = { response: RoundResponseDto; feed?: FeedEventDto };
export type AgentActionContext = {
  experimentId: string;
  ruleVersionId: string;
  before: (tx: Tx, user: UserRow, round?: RoundRow) => Promise<void>;
  after: (tx: Tx, response: RoundResponseDto) => Promise<void>;
};

@Injectable()
export class RoundsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(MINE_SOURCE) private readonly mineSource: MineSource,
    private readonly rules: RulesService,
    private readonly feed: FeedGateway,
  ) {}

  async start(userId: string, bet: number, agent?: AgentActionContext): Promise<RoundResponseDto> {
    try {
      return await this.db.transaction(async (tx) => {
        const user = await this.lockUser(tx, userId);
        await agent?.before(tx, user);
        const rule = agent ? await this.rules.byId(agent.ruleVersionId, tx) : await this.rules.active(tx);
        if (bet < rule.minBet || bet % rule.betStep !== 0)
          throw apiError(400, 'BET_INVALID', `Ставка — от ${rule.minBet} с шагом ${rule.betStep}`);
        if (bet > user.balance) throw apiError(400, 'INSUFFICIENT_BALANCE', 'Недостаточно монет');
        const [active] = await tx
          .select({ id: rounds.id })
          .from(rounds)
          .where(and(eq(rounds.userId, userId), eq(rounds.status, 'active')));
        if (active) throw apiError(409, 'ROUND_ACTIVE', 'Раунд уже идёт');

        const mines = this.mineSource();
        const salt = newSalt();
        const id = newId();
        const balance = user.balance - bet;
        await tx.insert(rounds).values({
          id,
          userId,
          ruleVersionId: rule.id,
          experimentId: agent?.experimentId,
          client: agent ? 'agent' : 'web',
          roundNo: user.roundsCount + 1,
          bet,
          balanceBefore: user.balance,
          mines,
          salt,
          hash: layoutHash(mines, salt),
        });
        await tx
          .update(users)
          .set({
            balance,
            totalWagered: sql`${users.totalWagered} + ${bet}`,
            roundsCount: sql`${users.roundsCount} + 1`,
          })
          .where(eq(users.id, userId));
        await tx.insert(ledger).values({
          userId,
          kind: 'bet',
          amount: -bet,
          balanceBefore: user.balance,
          balanceAfter: balance,
          roundId: id,
        });
        const round = await this.lockRound(tx, userId, id);
        const response = { round: toRoundDto(round, [], rule), balance };
        await agent?.after(tx, response);
        return response;
      });
    } catch (e) {
      if (isDuplicateKey(e) && !agent) throw apiError(409, 'ROUND_ACTIVE', 'Раунд уже идёт');
      throw e;
    }
  }

  async open(user: UserRow, roundId: string, cell: number, agent?: AgentActionContext): Promise<RoundResponseDto> {
    const outcome = await this.db.transaction(async (tx): Promise<Outcome> => {
      const locked = await this.lockUser(tx, user.id);
      const round = await this.lockRound(tx, user.id, roundId);
      await agent?.before(tx, locked, round);
      const rule = await this.rules.byId(round.ruleVersionId, tx);
      const actions = await this.actions(tx, round.id);
      const opened = actions.filter((a) => a.type === 'open').map((a) => a.cell);
      if (round.status !== 'active' || opened.includes(cell)) {
        if (agent) throw apiError(409, 'ROUND_ACTIVE', 'Действие уже недоступно');
        return { response: { round: toRoundDto(round, actions, rule), balance: locked.balance } };
      }

      const seq = actions.length + 1;
      const stake = {
        safeBefore: round.safeCount,
        multiplier: multiplier(round.safeCount, rule.rtp),
        potentialPayout: payout(round.bet, round.safeCount, rule.rtp),
      };

      if (round.mines.includes(cell)) {
        await tx.insert(roundActions).values({ roundId, seq, type: 'open', cell, result: 'mine', ...stake });
        await tx
          .update(rounds)
          .set({
            status: 'hit_mine',
            endReason: 'mine',
            hitCell: cell,
            payout: 0,
            multiplier: 0,
            balanceAfter: locked.balance,
            finishedAt: new Date(),
          })
          .where(eq(rounds.id, roundId));
        const outcome = await this.finished(tx, locked, roundId, rule, locked.balance);
        await agent?.after(tx, outcome.response);
        return outcome;
      }

      await tx.insert(roundActions).values({ roundId, seq, type: 'open', cell, result: 'safe', ...stake });
      const safeCount = round.safeCount + 1;
      await tx.update(rounds).set({ safeCount }).where(eq(rounds.id, roundId));
      if (safeCount === SAFE) {
        const outcome = await this.cashOutLocked(tx, locked, { ...round, safeCount }, rule, seq + 1, 'all_safe');
        await agent?.after(tx, outcome.response);
        return outcome;
      }

      const updated = await this.lockRound(tx, user.id, roundId);
      const outcome: Outcome = {
        response: { round: toRoundDto(updated, await this.actions(tx, roundId), rule), balance: locked.balance },
      };
      await agent?.after(tx, outcome.response);
      return outcome;
    });
    return this.emit(outcome);
  }

  async cashOut(user: UserRow, roundId: string, agent?: AgentActionContext): Promise<RoundResponseDto> {
    const outcome = await this.db.transaction(async (tx): Promise<Outcome> => {
      const locked = await this.lockUser(tx, user.id);
      const round = await this.lockRound(tx, user.id, roundId);
      await agent?.before(tx, locked, round);
      const rule = await this.rules.byId(round.ruleVersionId, tx);
      const actions = await this.actions(tx, round.id);
      if (round.status !== 'active') {
        if (agent) throw apiError(409, 'ROUND_ACTIVE', 'Раунд уже завершён');
        return { response: { round: toRoundDto(round, actions, rule), balance: locked.balance } };
      }
      if (round.safeCount === 0) throw apiError(400, 'CASH_OUT_UNAVAILABLE', 'Сначала открой клетку');
      const outcome = await this.cashOutLocked(tx, locked, round, rule, actions.length + 1, 'cash_out');
      await agent?.after(tx, outcome.response);
      return outcome;
    });
    return this.emit(outcome);
  }

  async active(userId: string): Promise<ActiveRoundResponseDto> {
    const [round] = await this.db
      .select()
      .from(rounds)
      .where(and(eq(rounds.userId, userId), eq(rounds.status, 'active')));
    if (!round) return { round: null };
    const rule = await this.rules.byId(round.ruleVersionId);
    const dto = toRoundDto(round, await this.actions(this.db, round.id), rule);
    return { round: dto.status === 'active' ? dto : null };
  }

  async list(userId: string, cursor: number | undefined, limit: number): Promise<RoundsPageDto> {
    const rows = await this.db
      .select()
      .from(rounds)
      .where(
        and(
          eq(rounds.userId, userId),
          inArray(rounds.status, ['cashed_out', 'hit_mine']),
          cursor ? lt(rounds.roundNo, cursor) : undefined,
        ),
      )
      .orderBy(desc(rounds.roundNo))
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    const ids = page.map((r) => r.id);
    const actions = ids.length
      ? await this.db
          .select()
          .from(roundActions)
          .where(inArray(roundActions.roundId, ids))
          .orderBy(asc(roundActions.seq))
      : [];
    const ruleCache = new Map<string, RuleRow>();
    const items: FinishedRoundDto[] = [];
    for (const round of page) {
      const rule = ruleCache.get(round.ruleVersionId) ?? (await this.rules.byId(round.ruleVersionId));
      ruleCache.set(round.ruleVersionId, rule);
      items.push(
        toRoundDto(
          round,
          actions.filter((a) => a.roundId === round.id),
          rule,
        ) as FinishedRoundDto,
      );
    }
    const last = page.at(-1);
    return { items, nextCursor: rows.length > limit && last ? last.roundNo : null };
  }

  private async cashOutLocked(
    tx: Tx,
    user: UserRow,
    round: RoundRow,
    rule: RuleRow,
    seq: number,
    endReason: 'cash_out' | 'all_safe',
  ): Promise<Outcome> {
    const m = multiplier(round.safeCount, rule.rtp);
    const amount = payout(round.bet, round.safeCount, rule.rtp);
    const balance = user.balance + amount;
    await tx.insert(roundActions).values({
      roundId: round.id,
      seq,
      type: 'cash_out',
      safeBefore: round.safeCount,
      multiplier: m,
      potentialPayout: amount,
    });
    await tx
      .update(rounds)
      .set({
        status: 'cashed_out',
        endReason,
        multiplier: m,
        payout: amount,
        balanceAfter: balance,
        finishedAt: new Date(),
      })
      .where(eq(rounds.id, round.id));
    await tx
      .update(users)
      .set({ balance, totalPayout: sql`${users.totalPayout} + ${amount}` })
      .where(eq(users.id, user.id));
    await tx.insert(ledger).values({
      userId: user.id,
      kind: 'payout',
      amount,
      balanceBefore: user.balance,
      balanceAfter: balance,
      roundId: round.id,
    });
    return this.finished(tx, user, round.id, rule, balance);
  }

  private async finished(tx: Tx, user: UserRow, roundId: string, rule: RuleRow, balance: number): Promise<Outcome> {
    const round = await this.lockRound(tx, user.id, roundId);
    const dto = toRoundDto(round, await this.actions(tx, roundId), rule) as FinishedRoundDto;
    const feed: FeedEventDto | undefined = user.blockedAt
      ? undefined
      : {
          type: 'round.finished',
          nickname: user.nickname,
          isAi: user.isAi,
          safeCount: dto.safeCount,
          win: dto.status === 'cashed_out',
          net: dto.net,
          at: dto.finishedAt,
        };
    return { response: { round: dto, balance }, feed };
  }

  private emit({ response, feed }: Outcome): RoundResponseDto {
    if (feed) this.feed.publish(feed);
    return response;
  }

  private async lockUser(tx: Tx, userId: string): Promise<UserRow> {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (!user) throw apiError(401, 'UNAUTHORIZED', 'Нужно войти');
    if (user.blockedAt) throw apiError(403, 'ACCOUNT_BLOCKED', 'Аккаунт заблокирован');
    return user;
  }

  private async lockRound(tx: Tx, userId: string, roundId: string): Promise<RoundRow> {
    const [round] = await tx
      .select()
      .from(rounds)
      .where(and(eq(rounds.id, roundId), eq(rounds.userId, userId)))
      .for('update');
    if (!round) throw apiError(404, 'ROUND_NOT_FOUND', 'Раунд не найден');
    return round;
  }

  private actions(tx: Db | Tx, roundId: string) {
    return tx.select().from(roundActions).where(eq(roundActions.roundId, roundId)).orderBy(asc(roundActions.seq));
  }
}
