import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { agentDecisions, rounds, ruleVersions, users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { MeService } from '../src/players/me.service.js';
import { createTestApp, type TestApp } from './helpers.js';

describe('recorded agent experiment', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ agentApi: true });
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  async function participant(maxRounds = 2) {
    const manifest = {
      model: 'deepseek-flash',
      profileVersion: 'v1',
      participantsPerProfile: 1,
      profiles: [{ key: 'loss-chaser', title: 'Отыгрывающийся', promptHash: 'abc' }],
    };
    const body = { externalKey: 'pilot-001', name: 'Pilot', ruleVersion: 1, maxRounds, manifest };
    const experiment = await request(t.server).post('/api/internal/experiments').send(body).expect(201);
    const repeated = await request(t.server).post('/api/internal/experiments').send(body).expect(201);
    expect(repeated.body.id).toBe(experiment.body.id);
    const reordered = await request(t.server)
      .post('/api/internal/experiments')
      .send({
        ...body,
        manifest: {
          profiles: manifest.profiles,
          participantsPerProfile: 1,
          profileVersion: 'v1',
          model: 'deepseek-flash',
        },
      })
      .expect(201);
    expect(reordered.body.id).toBe(experiment.body.id);
    const agentBody = { profileKey: 'loss-chaser', slot: 1, nickname: 'AI_chaser_001' };
    const agent = await request(t.server)
      .post(`/api/internal/experiments/${experiment.body.id}/agents`)
      .send(agentBody)
      .expect(201);
    const repeatedAgent = await request(t.server)
      .post(`/api/internal/experiments/${experiment.body.id}/agents`)
      .send(agentBody)
      .expect(201);
    expect(repeatedAgent.body.agentId).toBe(agent.body.agentId);
    await request(t.server)
      .post('/api/auth/login')
      .send({ nickname: agentBody.nickname, password: 'password123' })
      .expect(401);
    return { experimentId: experiment.body.id as string, agentId: agent.body.agentId as string };
  }

  const payload = (action: string, extra: Record<string, unknown> = {}) => ({
    decisionId: crypto.randomUUID(),
    action,
    reason: 'Хочу проверить исход',
    modelId: 'deepseek-flash',
    inputTokens: 50,
    outputTokens: 20,
    ...extra,
  });

  it('records decisions atomically and returns the same result on retry', async () => {
    const { experimentId, agentId } = await participant();
    const path = `/api/internal/experiments/${experimentId}/agents/${agentId}`;
    const initial = await request(t.server).get(`${path}/state`).expect(200);
    expect(initial.body).toMatchObject({ balance: 10000, completedRounds: 0, allowedActions: ['bet', 'stop'] });
    expect(initial.body).not.toHaveProperty('mines');
    const bet = payload('bet', { amount: 100 });
    const first = await request(t.server).post(`${path}/decisions`).send(bet).expect(200);
    expect(first.body.round).toMatchObject({ status: 'active', bet: 100 });
    expect(first.body.round).not.toHaveProperty('mines');
    const retry = await request(t.server).post(`${path}/decisions`).send(bet).expect(200);
    expect(retry.body).toEqual(first.body);
    await request(t.server)
      .post(`${path}/decisions`)
      .send({ ...bet, amount: 200 })
      .expect(409);
    const [round] = await t.db.select().from(rounds).where(eq(rounds.id, first.body.round.id));
    expect(round).toMatchObject({ experimentId, client: 'agent', balanceBefore: 10000 });

    const open = payload('open', { roundId: first.body.round.id, cell: 0 });
    const lost = await request(t.server).post(`${path}/decisions`).send(open).expect(200);
    expect(lost.body.round.status).toBe('hit_mine');
    expect((await request(t.server).post(`${path}/decisions`).send(open).expect(200)).body).toEqual(lost.body);
    const state = await request(t.server).get(`${path}/state`).expect(200);
    expect(state.body).toMatchObject({ balance: 9900, completedRounds: 1 });
    const decisions = await t.db.select().from(agentDecisions).where(eq(agentDecisions.agentId, agentId));
    expect(decisions).toHaveLength(2);
  });

  it('enforces round limit and rejects stopping an active round', async () => {
    const { experimentId, agentId } = await participant(1);
    const path = `/api/internal/experiments/${experimentId}/agents/${agentId}`;
    const first = await request(t.server)
      .post(`${path}/decisions`)
      .send(payload('bet', { amount: 100 }))
      .expect(200);
    await request(t.server).post(`${path}/decisions`).send(payload('stop')).expect(400);
    await request(t.server)
      .post(`${path}/decisions`)
      .send(payload('open', { roundId: first.body.round.id, cell: 0 }))
      .expect(200);
    const state = await request(t.server).get(`${path}/state`).expect(200);
    expect(state.body.terminalReason).toBe('round_limit');
    await request(t.server)
      .post(`${path}/decisions`)
      .send(payload('bet', { amount: 100 }))
      .expect(409);
    await request(t.server).post(`/api/internal/experiments/${experimentId}/finish`).send({}).expect(200);
    const repeated = await request(t.server)
      .post(`/api/internal/experiments/${experimentId}/agents`)
      .send({ profileKey: 'loss-chaser', slot: 1, nickname: 'AI_chaser_001' })
      .expect(201);
    expect(repeated.body.agentId).toBe(agentId);
  });

  it('keeps the pinned rule version and disallows daily claims during a run', async () => {
    const { experimentId, agentId } = await participant();
    const [user] = await t.db.select().from(users).where(eq(users.nickname, 'AI_chaser_001'));
    if (!user) throw new Error('AI user missing');
    await t.db
      .update(users)
      .set({ balance: 50, lastDailyAt: new Date('2020-01-01') })
      .where(eq(users.id, user.id));
    await expect(t.app.get(MeService).claimDaily(user.id)).rejects.toMatchObject({
      response: { code: 'DAILY_UNAVAILABLE' },
    });
    await t.db.update(users).set({ balance: 10000 }).where(eq(users.id, user.id));
    await t.db.update(ruleVersions).set({ isActive: false }).where(eq(ruleVersions.version, 1));
    await t.db.insert(ruleVersions).values({
      version: 2,
      rtp: 0.9,
      minBet: 200,
      betStep: 100,
      startBalance: 10000,
      dailyTarget: 10000,
      isActive: true,
    });
    const result = await request(t.server)
      .post(`/api/internal/experiments/${experimentId}/agents/${agentId}/decisions`)
      .send(payload('bet', { amount: 100 }))
      .expect(200);
    expect(result.body.round).toMatchObject({ ruleVersion: 1, rtp: 0.973, bet: 100 });
  });
});
