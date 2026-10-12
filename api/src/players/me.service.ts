import { isDailyAvailable, nextDailyAt, normalizeStatus, type DailyClaimDto, type MeDto } from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { apiError } from '../common/api-error.js';
import { config } from '../config.js';
import { DB, type Db } from '../db/db.module.js';
import { ledger, statusHistory, users, type UserRow } from '../db/schema.js';
import { RulesService } from '../game/rules.service.js';
import { TOP_HUMANS } from './ranking.js';
import { PlayersService } from './players.service.js';

@Injectable()
export class MeService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly players: PlayersService,
    private readonly rules: RulesService,
  ) {}

  async get(user: UserRow): Promise<MeDto> {
    const [ranks, rule] = await Promise.all([this.players.ranks(user.nickname), this.rules.active()]);
    return {
      nickname: user.nickname,
      balance: user.balance,
      wagered: user.totalWagered,
      payout: user.totalPayout,
      net: user.totalPayout - user.totalWagered,
      roundsCount: user.roundsCount,
      rank: ranks?.rank ?? null,
      humanRank: ranks?.humanRank ?? null,
      status: user.statusText,
      statusHidden: Boolean(user.statusHiddenAt),
      nextDailyAt: nextDailyAt(user.lastDailyAt).toISOString(),
      dailyTarget: rule.dailyTarget,
      adminUrl: user.isAdmin && config.adminUrl ? config.adminUrl : null,
    };
  }

  async claimDaily(userId: string): Promise<DailyClaimDto> {
    return this.db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
      if (!user) throw apiError(401, 'UNAUTHORIZED', 'Нужно войти');
      const rule = await this.rules.active(tx);
      const now = new Date();
      if (!isDailyAvailable({ balance: user.balance, target: rule.dailyTarget, lastClaimAt: user.lastDailyAt, now }))
        throw apiError(400, 'DAILY_UNAVAILABLE', 'Ежедневная выдача пока недоступна');
      const added = rule.dailyTarget - user.balance;
      await tx.update(users).set({ balance: rule.dailyTarget, lastDailyAt: now }).where(eq(users.id, userId));
      await tx.insert(ledger).values({
        userId,
        kind: 'daily',
        amount: added,
        balanceBefore: user.balance,
        balanceAfter: rule.dailyTarget,
      });
      return { balance: rule.dailyTarget, added, nextDailyAt: nextDailyAt(now).toISOString() };
    });
  }

  async setStatus(user: UserRow, text: string): Promise<MeDto> {
    const ranks = await this.players.ranks(user.nickname);
    if (user.isAi || !ranks?.humanRank || ranks.humanRank > TOP_HUMANS)
      throw apiError(403, 'STATUS_FORBIDDEN', 'Статус доступен пятёрке лучших людей');
    const clean = normalizeStatus(text);
    await this.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ statusText: clean || null, statusUpdatedAt: new Date() })
        .where(eq(users.id, user.id));
      if (clean) await tx.insert(statusHistory).values({ userId: user.id, text: clean });
    });
    const [fresh] = await this.db.select().from(users).where(eq(users.id, user.id));
    if (!fresh) throw apiError(401, 'UNAUTHORIZED', 'Нужно войти');
    return this.get(fresh);
  }
}
