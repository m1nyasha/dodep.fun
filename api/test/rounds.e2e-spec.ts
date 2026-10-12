import { createHash } from 'node:crypto';
import { layoutString, multiplier, payout } from '@dodep/shared';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ledger, roundActions, rounds } from '../src/db/schema.js';
import { createTestApp, register, setMines, type TestApp } from './helpers.js';

const RTP = 0.973;

describe('rounds', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('starts a round without leaking mines', async () => {
    const agent = await register(t.server, 'p1a');
    const res = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    expect(res.body.balance).toBe(9_900);
    expect(res.body.round).toMatchObject({
      status: 'active',
      bet: 100,
      roundNo: 1,
      safeCount: 0,
      opened: [],
      multiplier: 1,
      potentialPayout: 100,
      ruleVersion: 1,
      rtp: RTP,
    });
    expect(res.body.round).not.toHaveProperty('mines');
    expect(res.body.round).not.toHaveProperty('salt');
    expect(res.body.round.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('loses on a mine and reveals a layout that matches the hash', async () => {
    const agent = await register(t.server, 'p1a');
    const start = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    const id = start.body.round.id;

    const safe = await agent.post(`/api/rounds/${id}/open`).send({ cell: 10 }).expect(200);
    expect(safe.body.round).toMatchObject({
      status: 'active',
      safeCount: 1,
      opened: [10],
      multiplier: multiplier(1, RTP),
      potentialPayout: payout(100, 1, RTP),
    });

    const boom = await agent.post(`/api/rounds/${id}/open`).send({ cell: 3 }).expect(200);
    expect(boom.body.balance).toBe(9_900);
    expect(boom.body.round).toMatchObject({
      status: 'hit_mine',
      endReason: 'mine',
      hitCell: 3,
      payout: 0,
      net: -100,
      mines: [0, 1, 2, 3, 4],
      opened: [10],
    });
    const expectedHash = createHash('sha256')
      .update(layoutString(boom.body.round.mines, boom.body.round.salt))
      .digest('hex');
    expect(boom.body.round.hash).toBe(expectedHash);
    expect(boom.body.round.hash).toBe(start.body.round.hash);

    const actions = await t.db
      .select()
      .from(roundActions)
      .where(eq(roundActions.roundId, id))
      .orderBy(roundActions.seq);
    expect(actions.map((a) => [a.seq, a.type, a.cell, a.result, a.safeBefore, a.potentialPayout])).toEqual([
      [1, 'open', 10, 'safe', 0, 100],
      [2, 'open', 3, 'mine', 1, payout(100, 1, RTP)],
    ]);
    const [row] = await t.db.select().from(rounds).where(eq(rounds.id, id));
    expect(row).toMatchObject({ balanceBefore: 10_000, balanceAfter: 9_900, safeCount: 1 });
  });

  it('cashes out with the precise multiplier and writes the ledger', async () => {
    const agent = await register(t.server, 'p1a');
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 10 }).expect(200);
    await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 11 }).expect(200);
    const res = await agent.post(`/api/rounds/${body.round.id}/cash-out`).expect(200);
    expect(res.body.round).toMatchObject({
      status: 'cashed_out',
      endReason: 'cash_out',
      payout: 154,
      net: 54,
      multiplier: 1.536316,
    });
    expect(res.body.balance).toBe(10_054);

    const me = await agent.get('/api/me').expect(200);
    expect(me.body).toMatchObject({ balance: 10_054, wagered: 100, payout: 154, net: 54, roundsCount: 1 });
    const entries = await t.db.select().from(ledger).orderBy(ledger.createdAt, ledger.id);
    expect(entries.map((e) => [e.kind, e.amount, e.balanceAfter])).toEqual([
      ['signup', 10_000, 10_000],
      ['bet', -100, 9_900],
      ['payout', 154, 10_054],
    ]);
  });

  it('auto cashes out after all 20 safe cells', async () => {
    const agent = await register(t.server, 'p1a');
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    const responses: Awaited<ReturnType<typeof agent.post>>[] = [];
    for (let cell = 5; cell < 25; cell++)
      responses.push(await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell }).expect(200));
    const last = responses.at(-1);
    expect(last).toBeDefined();
    expect(last?.body.round).toMatchObject({
      status: 'cashed_out',
      endReason: 'all_safe',
      safeCount: 20,
      payout: 5_169_549,
    });
  });

  it('rejects invalid bets', async () => {
    const agent = await register(t.server, 'p1a');
    expect((await agent.post('/api/rounds').send({ bet: 150 }).expect(400)).body.code).toBe('BET_INVALID');
    expect((await agent.post('/api/rounds').send({ bet: 0 }).expect(400)).body.code).toBe('BET_INVALID');
    expect((await agent.post('/api/rounds').send({ bet: 20_000 }).expect(400)).body.code).toBe('INSUFFICIENT_BALANCE');
    await agent.post('/api/rounds').send({ bet: 'x' }).expect(400);
  });

  it('forbids cash-out before the first cell and a second active round', async () => {
    const agent = await register(t.server, 'p1a');
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    expect((await agent.post(`/api/rounds/${body.round.id}/cash-out`).expect(400)).body.code).toBe(
      'CASH_OUT_UNAVAILABLE',
    );
    expect((await agent.post('/api/rounds').send({ bet: 100 }).expect(409)).body.code).toBe('ROUND_ACTIVE');
  });

  it('is idempotent for repeated clicks and finished rounds', async () => {
    const agent = await register(t.server, 'p1a');
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 10 }).expect(200);
    const again = await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 10 }).expect(200);
    expect(again.body.round.safeCount).toBe(1);
    await agent.post(`/api/rounds/${body.round.id}/cash-out`).expect(200);
    const after = await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 0 }).expect(200);
    expect(after.body.round.status).toBe('cashed_out');
    const actions = await t.db.select().from(roundActions).where(eq(roundActions.roundId, body.round.id));
    expect(actions).toHaveLength(2);
  });

  it('pays exactly once under parallel cash-outs', async () => {
    const agent = await register(t.server, 'p1a');
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 10 }).expect(200);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => agent.post(`/api/rounds/${body.round.id}/cash-out`)),
    );
    expect(results.every((r) => r.status === 200 && r.body.round.payout === 122)).toBe(true);
    const payouts = await t.db.select().from(ledger).where(eq(ledger.kind, 'payout'));
    expect(payouts).toHaveLength(1);
    expect((await agent.get('/api/me')).body.balance).toBe(10_022);
  });

  it('starts only one round under parallel starts', async () => {
    const agent = await register(t.server, 'p1a');
    const results = await Promise.all(Array.from({ length: 4 }, () => agent.post('/api/rounds').send({ bet: 100 })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    expect((await agent.get('/api/me')).body.balance).toBe(9_900);
  });

  it('restores the active round and hides other players rounds', async () => {
    const agent = await register(t.server, 'p1a');
    const other = await register(t.server, 'p2a');
    expect((await agent.get('/api/rounds/active').expect(200)).body).toEqual({ round: null });
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 12 }).expect(200);
    const active = await agent.get('/api/rounds/active').expect(200);
    expect(active.body.round).toMatchObject({ id: body.round.id, opened: [12], safeCount: 1 });
    expect(active.body.round).not.toHaveProperty('mines');
    expect((await other.post(`/api/rounds/${body.round.id}/open`).send({ cell: 13 }).expect(404)).body.code).toBe(
      'ROUND_NOT_FOUND',
    );
  });

  it('lists the journal newest first with cursor paging', async () => {
    const agent = await register(t.server, 'p1a');
    setMines([20, 21, 22, 23, 24]);
    for (let i = 0; i < 3; i++) {
      const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
      await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 20 }).expect(200);
    }
    const first = await agent.get('/api/rounds?limit=2').expect(200);
    expect(first.body.items.map((r: { roundNo: number }) => r.roundNo)).toEqual([3, 2]);
    expect(first.body.items[0]).toMatchObject({ status: 'hit_mine', mines: [20, 21, 22, 23, 24] });
    expect(first.body.nextCursor).toBe(2);
    const second = await agent.get('/api/rounds?limit=2&cursor=2').expect(200);
    expect(second.body.items.map((r: { roundNo: number }) => r.roundNo)).toEqual([1]);
    expect(second.body.nextCursor).toBeNull();
  });

  it('serves the rules ladder', async () => {
    const res = await request(t.server).get('/api/rules').expect(200);
    expect(res.body).toMatchObject({
      version: 1,
      rtp: RTP,
      minBet: 100,
      betStep: 100,
      startBalance: 10_000,
      dailyTarget: 10_000,
      cells: 25,
      mines: 5,
    });
    expect(res.body.ladder).toHaveLength(20);
    expect(res.body.ladder[0]).toEqual({ k: 1, chance: 0.8, multiplier: 1.21625 });
  });

  it('requires a session', async () => {
    await request(t.server).post('/api/rounds').send({ bet: 100 }).expect(401);
  });
});
