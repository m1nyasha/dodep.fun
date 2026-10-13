import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ne } from 'drizzle-orm';
import type { z } from 'zod';
import { apiError } from '../common/api-error.js';
import { DB, type Db, type Tx } from '../db/db.module.js';
import { isDuplicateKey } from '../db/errors.js';
import {
  agentDecisions,
  experimentAgents,
  experiments,
  ledger,
  newId,
  rounds,
  ruleVersions,
  users,
  type UserRow,
} from '../db/schema.js';
import { RoundsService, type AgentActionContext } from '../game/rounds.service.js';
import { RulesService } from '../game/rules.service.js';
import { agentSchema, decisionSchema, experimentSchema } from './agents.schemas.js';

type CreateExperiment = z.infer<typeof experimentSchema>;
type CreateAgent = z.infer<typeof agentSchema>;
type Decision = z.infer<typeof decisionSchema>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

@Injectable()
export class AgentsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly rules: RulesService,
    private readonly game: RoundsService,
  ) {}

  async createExperiment(input: CreateExperiment) {
    const [existing] = await this.db.select().from(experiments).where(eq(experiments.externalKey, input.externalKey));
    if (existing) {
      const existingRule = await this.rules.byId(existing.ruleVersionId);
      if (
        existing.name !== input.name ||
        existing.maxRounds !== input.maxRounds ||
        existingRule.version !== input.ruleVersion ||
        canonical(existing.manifest) !== canonical(input.manifest)
      )
        throw apiError(409, 'ROUND_ACTIVE', 'Ключ запуска уже используется с другим манифестом');
      return this.experimentDto(existing);
    }
    const profileKeys = Array.isArray(input.manifest.profiles)
      ? input.manifest.profiles.map((profile) =>
          profile && typeof profile === 'object' && 'key' in profile ? profile.key : null,
        )
      : [];
    if (
      input.manifest.participantsPerProfile !== 1 ||
      profileKeys.length === 0 ||
      profileKeys.some((key) => typeof key !== 'string' || !/^[a-z0-9-]{2,40}$/.test(key)) ||
      new Set(profileKeys).size !== profileKeys.length
    )
      throw apiError(400, 'BET_INVALID', 'Манифест должен содержать по одному участнику каждого типажа');
    const [rule] = await this.db.select().from(ruleVersions).where(eq(ruleVersions.version, input.ruleVersion));
    if (!rule) throw apiError(404, 'RULE_NOT_FOUND', 'Версия правил не найдена');
    if (rule.startBalance !== 10000 || rule.minBet !== 100 || rule.betStep !== 100)
      throw apiError(400, 'BET_INVALID', 'Правила не соответствуют условиям эксперимента');
    try {
      await this.db.insert(experiments).values({
        externalKey: input.externalKey,
        name: input.name,
        ruleVersionId: rule.id,
        startedAt: new Date(),
        maxRounds: input.maxRounds,
        manifest: input.manifest,
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
    const [row] = await this.db.select().from(experiments).where(eq(experiments.externalKey, input.externalKey));
    if (!row) throw new Error('Experiment insert failed');
    if (
      row.name !== input.name ||
      row.maxRounds !== input.maxRounds ||
      row.ruleVersionId !== rule.id ||
      canonical(row.manifest) !== canonical(input.manifest)
    )
      throw apiError(409, 'ROUND_ACTIVE', 'Ключ запуска уже используется с другим манифестом');
    return this.experimentDto(row);
  }

  async createAgent(experimentId: string, input: CreateAgent) {
    const [experiment] = await this.db.select().from(experiments).where(eq(experiments.id, experimentId));
    if (!experiment) throw apiError(404, 'PLAYER_NOT_FOUND', 'Запуск не найден');
    const profiles = Array.isArray(experiment.manifest.profiles) ? experiment.manifest.profiles : [];
    if (
      input.slot !== 1 ||
      !profiles.some(
        (profile) => profile && typeof profile === 'object' && 'key' in profile && profile.key === input.profileKey,
      )
    )
      throw apiError(400, 'BET_INVALID', 'Типаж или слот отсутствует в манифесте');
    const [existing] = await this.db
      .select()
      .from(experimentAgents)
      .where(
        and(
          eq(experimentAgents.experimentId, experimentId),
          eq(experimentAgents.profileKey, input.profileKey),
          eq(experimentAgents.slot, input.slot),
        ),
      );
    if (existing) return { agentId: existing.id, nickname: (await this.user(existing.userId)).nickname };
    if (experiment.finishedAt) throw apiError(409, 'ROUND_ACTIVE', 'Запуск завершён');
    const rule = await this.rules.byId(experiment.ruleVersionId);
    const userId = newId();
    const agentId = newId();
    const passwordHash = await hash(randomBytes(48).toString('hex'));
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          nickname: input.nickname,
          passwordHash,
          isAi: true,
          aiType: input.profileKey,
          balance: rule.startBalance,
          lastDailyAt: new Date(),
        });
        await tx.insert(ledger).values({
          userId,
          kind: 'signup',
          amount: rule.startBalance,
          balanceBefore: 0,
          balanceAfter: rule.startBalance,
        });
        await tx
          .insert(experimentAgents)
          .values({ id: agentId, experimentId, userId, profileKey: input.profileKey, slot: input.slot });
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const [winner] = await this.db
        .select()
        .from(experimentAgents)
        .where(
          and(
            eq(experimentAgents.experimentId, experimentId),
            eq(experimentAgents.profileKey, input.profileKey),
            eq(experimentAgents.slot, input.slot),
          ),
        );
      if (winner) return { agentId: winner.id, nickname: (await this.user(winner.userId)).nickname };
      throw apiError(409, 'NICKNAME_TAKEN', 'Ник уже занят');
    }
    return { agentId, nickname: input.nickname };
  }

  async state(experimentId: string, agentId: string) {
    const { experiment, agent, user, rule } = await this.lookup(experimentId, agentId);
    const [completed] = await this.db
      .select({ n: count() })
      .from(rounds)
      .where(and(eq(rounds.userId, user.id), eq(rounds.experimentId, experimentId), ne(rounds.status, 'active')));
    const active = await this.game.active(user.id);
    const recent = await this.db
      .select({
        bet: rounds.bet,
        payout: rounds.payout,
        safeCount: rounds.safeCount,
        status: rounds.status,
        finishedAt: rounds.finishedAt,
      })
      .from(rounds)
      .where(and(eq(rounds.userId, user.id), eq(rounds.experimentId, experimentId), ne(rounds.status, 'active')))
      .orderBy(desc(rounds.finishedAt))
      .limit(5);
    const terminalReason = experiment.finishedAt
      ? 'experiment_finished'
      : agent.status !== 'running'
        ? agent.status
        : active.round
          ? null
          : (completed?.n ?? 0) >= experiment.maxRounds
            ? 'round_limit'
            : user.balance < rule.minBet
              ? 'insufficient_balance'
              : null;
    return {
      agentId,
      nickname: user.nickname,
      profileKey: agent.profileKey,
      stopReason: agent.stopReason,
      slot: agent.slot,
      balance: user.balance,
      completedRounds: completed?.n ?? 0,
      maxRounds: experiment.maxRounds,
      wagered: user.totalWagered,
      payout: user.totalPayout,
      rule: { version: rule.version, rtp: rule.rtp, minBet: rule.minBet, betStep: rule.betStep },
      activeRound: active.round,
      recentRounds: recent.map((r) => ({ ...r, finishedAt: r.finishedAt?.toISOString() ?? null })),
      allowedActions: terminalReason
        ? []
        : active.round
          ? active.round.safeCount
            ? ['open', 'cash_out']
            : ['open']
          : ['bet', 'stop'],
      terminalReason,
    };
  }

  async decide(experimentId: string, agentId: string, decision: Decision) {
    const previous = await this.previous(decision.decisionId, experimentId, agentId, decision);
    if (previous) return previous;
    const { experiment, agent, user } = await this.lookup(experimentId, agentId);
    if (experiment.finishedAt || agent.status !== 'running')
      throw apiError(409, 'ROUND_ACTIVE', 'Агент уже остановлен');
    const record = async (tx: Tx, result: Record<string, unknown>) => {
      await tx.insert(agentDecisions).values({
        id: decision.decisionId,
        experimentId,
        agentId,
        action: decision.action,
        amount: decision.amount ?? null,
        cell: decision.cell ?? null,
        reason: decision.reason,
        modelId: decision.modelId,
        inputTokens: decision.inputTokens,
        outputTokens: decision.outputTokens,
        result,
      });
    };
    try {
      if (decision.action === 'stop') {
        return await this.db.transaction(async (tx) => {
          const locked = await this.lockUser(tx, user.id);
          await this.assertAgentRunning(tx, experimentId, agentId);
          const [active] = await tx
            .select({ id: rounds.id })
            .from(rounds)
            .where(and(eq(rounds.userId, locked.id), eq(rounds.status, 'active')));
          if (active) throw apiError(400, 'ROUND_ACTIVE', 'Нужно завершить раунд');
          const result = { status: 'stopped', balance: locked.balance };
          await tx
            .update(experimentAgents)
            .set({ status: 'stopped', stopReason: 'voluntary', finishedAt: new Date() })
            .where(eq(experimentAgents.id, agentId));
          await record(tx, result);
          return result;
        });
      }
      const context: AgentActionContext = {
        experimentId,
        ruleVersionId: experiment.ruleVersionId,
        before: async (tx, locked, round) => {
          await this.assertAgentRunning(tx, experimentId, agentId);
          if (round) {
            if (round.experimentId !== experimentId || round.ruleVersionId !== experiment.ruleVersionId)
              throw apiError(403, 'UNAUTHORIZED', 'Раунд не принадлежит запуску');
          } else {
            const [total] = await tx
              .select({ n: count() })
              .from(rounds)
              .where(and(eq(rounds.userId, locked.id), eq(rounds.experimentId, experimentId)));
            if ((total?.n ?? 0) >= experiment.maxRounds) throw apiError(409, 'ROUND_ACTIVE', 'Лимит раундов достигнут');
          }
        },
        after: async (tx, response) => record(tx, JSON.parse(JSON.stringify(response)) as Record<string, unknown>),
      };
      if (decision.action === 'bet') {
        if (decision.amount === undefined) throw apiError(400, 'BET_INVALID', 'Не указана ставка');
        return await this.game.start(user.id, decision.amount, context);
      }
      if (decision.action === 'open') {
        if (!decision.roundId || decision.cell === undefined) throw apiError(400, 'BET_INVALID', 'Не указана клетка');
        return await this.game.open(user, decision.roundId, decision.cell, context);
      }
      if (!decision.roundId) throw apiError(400, 'ROUND_NOT_FOUND', 'Не указан раунд');
      return await this.game.cashOut(user, decision.roundId, context);
    } catch (error) {
      const prior = await this.previous(decision.decisionId, experimentId, agentId, decision);
      if (prior) return prior;
      throw error;
    }
  }

  async technicalStop(experimentId: string, agentId: string, reason: string) {
    const { user } = await this.lookup(experimentId, agentId);
    await this.db.transaction(async (tx) => {
      await this.lockUser(tx, user.id);
      const [agent] = await tx.select().from(experimentAgents).where(eq(experimentAgents.id, agentId)).for('update');
      if (agent?.status === 'running')
        await tx
          .update(experimentAgents)
          .set({ status: 'technical_stop', stopReason: reason, finishedAt: new Date() })
          .where(eq(experimentAgents.id, agentId));
    });
    return { ok: true };
  }

  async resume(experimentId: string, agentId: string) {
    const { experiment, user } = await this.lookup(experimentId, agentId);
    if (experiment.finishedAt) throw apiError(409, 'ROUND_ACTIVE', 'Запуск завершён');
    await this.db.transaction(async (tx) => {
      await this.lockUser(tx, user.id);
      const [agent] = await tx.select().from(experimentAgents).where(eq(experimentAgents.id, agentId)).for('update');
      if (agent?.status !== 'technical_stop')
        throw apiError(409, 'ROUND_ACTIVE', 'Возобновить можно только техническую остановку');
      await tx
        .update(experimentAgents)
        .set({ status: 'running', stopReason: null, finishedAt: null })
        .where(eq(experimentAgents.id, agentId));
    });
    return { ok: true };
  }

  async finish(experimentId: string) {
    const [experiment] = await this.db.select().from(experiments).where(eq(experiments.id, experimentId));
    if (!experiment) throw apiError(404, 'PLAYER_NOT_FOUND', 'Запуск не найден');
    if (experiment.finishedAt) return { ok: true };
    const [participants] = await this.db
      .select({ n: count() })
      .from(experimentAgents)
      .where(eq(experimentAgents.experimentId, experimentId));
    const expected = Array.isArray(experiment.manifest.profiles) ? experiment.manifest.profiles.length : 0;
    if ((participants?.n ?? 0) !== expected) throw apiError(409, 'ROUND_ACTIVE', 'Не все типажи получили участника');
    const [active] = await this.db
      .select({ n: count() })
      .from(rounds)
      .where(and(eq(rounds.experimentId, experimentId), eq(rounds.status, 'active')));
    if ((active?.n ?? 0) > 0) throw apiError(409, 'ROUND_ACTIVE', 'Участники должны завершить активные раунды');
    const [running] = await this.db
      .select({ n: count() })
      .from(experimentAgents)
      .where(and(eq(experimentAgents.experimentId, experimentId), eq(experimentAgents.status, 'running')));
    if ((running?.n ?? 0) > 0) {
      const states = await this.monitor(experimentId);
      if (states.agents.some((a) => !a.terminalReason)) throw apiError(409, 'ROUND_ACTIVE', 'Есть активные агенты');
    }
    await this.db.update(experiments).set({ finishedAt: new Date() }).where(eq(experiments.id, experimentId));
    return { ok: true };
  }

  async monitor(experimentId: string) {
    const [experiment] = await this.db.select().from(experiments).where(eq(experiments.id, experimentId));
    if (!experiment) throw apiError(404, 'PLAYER_NOT_FOUND', 'Запуск не найден');
    const agents = await this.db
      .select()
      .from(experimentAgents)
      .where(eq(experimentAgents.experimentId, experimentId))
      .orderBy(asc(experimentAgents.profileKey), asc(experimentAgents.slot));
    const states = await Promise.all(agents.map((a) => this.state(experimentId, a.id)));
    const profileNames = new Map(
      (Array.isArray(experiment.manifest.profiles) ? experiment.manifest.profiles : [])
        .filter((profile): profile is { key: string; title: string } =>
          Boolean(
            profile &&
            typeof profile === 'object' &&
            'key' in profile &&
            'title' in profile &&
            typeof profile.key === 'string' &&
            typeof profile.title === 'string',
          ),
        )
        .map((profile) => [profile.key, profile.title]),
    );
    const decisions = await this.db
      .select()
      .from(agentDecisions)
      .where(eq(agentDecisions.experimentId, experimentId))
      .orderBy(desc(agentDecisions.createdAt), desc(agentDecisions.id))
      .limit(100);
    return {
      experiment: this.experimentDto(experiment),
      agents: states.map((state) => ({
        ...state,
        profileTitle: profileNames.get(state.profileKey) ?? state.profileKey,
      })),
      decisions: decisions.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })),
    };
  }

  async exportDecisions(experimentId: string) {
    const [experiment] = await this.db
      .select({ id: experiments.id })
      .from(experiments)
      .where(eq(experiments.id, experimentId));
    if (!experiment) throw apiError(404, 'PLAYER_NOT_FOUND', 'Запуск не найден');
    return this.db
      .select()
      .from(agentDecisions)
      .where(eq(agentDecisions.experimentId, experimentId))
      .orderBy(asc(agentDecisions.createdAt), asc(agentDecisions.id));
  }

  private experimentDto(row: typeof experiments.$inferSelect) {
    return {
      id: row.id,
      externalKey: row.externalKey,
      name: row.name,
      manifest: row.manifest,
      maxRounds: row.maxRounds,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
    };
  }

  private async lookup(experimentId: string, agentId: string) {
    const [experiment] = await this.db.select().from(experiments).where(eq(experiments.id, experimentId));
    const [agent] = await this.db
      .select()
      .from(experimentAgents)
      .where(and(eq(experimentAgents.id, agentId), eq(experimentAgents.experimentId, experimentId)));
    if (!experiment || !agent) throw apiError(404, 'PLAYER_NOT_FOUND', 'Участник не найден');
    const [user, rule] = await Promise.all([this.user(agent.userId), this.rules.byId(experiment.ruleVersionId)]);
    if (!user.isAi || user.blockedAt) throw apiError(403, 'ACCOUNT_BLOCKED', 'AI-аккаунт недоступен');
    return { experiment, agent, user, rule };
  }

  private async user(id: string): Promise<UserRow> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    if (!user) throw apiError(404, 'PLAYER_NOT_FOUND', 'Участник не найден');
    return user;
  }

  private async lockUser(tx: Tx, id: string): Promise<UserRow> {
    const [user] = await tx.select().from(users).where(eq(users.id, id)).for('update');
    if (!user) throw apiError(404, 'PLAYER_NOT_FOUND', 'Участник не найден');
    return user;
  }

  private async assertAgentRunning(tx: Tx, experimentId: string, agentId: string) {
    const [agent] = await tx
      .select()
      .from(experimentAgents)
      .where(and(eq(experimentAgents.id, agentId), eq(experimentAgents.experimentId, experimentId)))
      .for('update');
    if (!agent || agent.status !== 'running') throw apiError(409, 'ROUND_ACTIVE', 'Агент уже остановлен');
  }

  private async previous(id: string, experimentId: string, agentId: string, decision: Decision) {
    const [row] = await this.db.select().from(agentDecisions).where(eq(agentDecisions.id, id));
    if (!row) return null;
    if (row.experimentId !== experimentId || row.agentId !== agentId)
      throw apiError(409, 'ROUND_ACTIVE', 'decisionId принадлежит другому участнику');
    if (
      row.action !== decision.action ||
      row.amount !== (decision.amount ?? null) ||
      row.cell !== (decision.cell ?? null) ||
      row.reason !== decision.reason ||
      row.modelId !== decision.modelId ||
      row.inputTokens !== decision.inputTokens ||
      row.outputTokens !== decision.outputTokens
    )
      throw apiError(409, 'ROUND_ACTIVE', 'decisionId уже использован для другого решения');
    return row.result;
  }
}
