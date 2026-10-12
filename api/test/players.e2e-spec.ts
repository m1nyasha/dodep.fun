import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, register, setUser, type TestApp } from './helpers.js';

describe('players', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('returns me with ranks and the next daily time', async () => {
    const agent = await register(t.server, 'northstar');
    const me = await agent.get('/api/me').expect(200);
    expect(me.body).toMatchObject({
      nickname: 'northstar',
      balance: 10_000,
      wagered: 0,
      payout: 0,
      net: 0,
      rank: 1,
      humanRank: 1,
      status: null,
      statusHidden: false,
      dailyTarget: 10_000,
      adminUrl: null,
    });
    expect(new Date(me.body.nextDailyAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns adminUrl only for admins', async () => {
    const agent = await register(t.server, 'boss');
    await setUser(t.db, 'boss', { isAdmin: true });
    const me = await agent.get('/api/me').expect(200);
    expect(me.body.adminUrl).toBe('http://admin.test');
  });

  it('ranks by balance, gives humanRank only to humans and hides the blocked', async () => {
    await register(t.server, 'alpha');
    await register(t.server, 'beta');
    await register(t.server, 'gamma');
    await register(t.server, 'robot');
    await register(t.server, 'banned');
    await setUser(t.db, 'alpha', { balance: 5_000 });
    await setUser(t.db, 'beta', { balance: 20_000 });
    await setUser(t.db, 'robot', { balance: 30_000, isAi: true, aiType: 'Рисковый' });
    await setUser(t.db, 'banned', { balance: 99_000, blockedAt: new Date() });

    const all = await request(t.server).get('/api/leaderboard').expect(200);
    expect(all.body.total).toBe(4);
    expect(all.body.items.map((p: { nickname: string }) => p.nickname)).toEqual(['robot', 'beta', 'gamma', 'alpha']);
    expect(all.body.items[0]).toMatchObject({ rank: 1, humanRank: null, isAi: true, aiType: 'Рисковый', isTop: false });
    expect(all.body.items[1]).toMatchObject({ rank: 2, humanRank: 1, isTop: true });

    const ai = await request(t.server).get('/api/leaderboard?filter=ai').expect(200);
    expect(ai.body.items.map((p: { nickname: string }) => p.nickname)).toEqual(['robot']);

    const search = await request(t.server).get('/api/leaderboard?q=AMM').expect(200);
    expect(search.body.items.map((p: { nickname: string }) => p.nickname)).toEqual(['gamma']);

    const page = await request(t.server).get('/api/leaderboard?offset=1&limit=2').expect(200);
    expect(page.body.items.map((p: { nickname: string }) => p.nickname)).toEqual(['beta', 'gamma']);
  });

  it('shows a player card and 404 for unknown or blocked', async () => {
    await register(t.server, 'mono');
    const card = await request(t.server).get('/api/players/MONO').expect(200);
    expect(card.body).toMatchObject({ nickname: 'mono', rank: 1, balance: 10_000 });
    const missing = await request(t.server).get('/api/players/ghost').expect(404);
    expect(missing.body.code).toBe('PLAYER_NOT_FOUND');
    await setUser(t.db, 'mono', { blockedAt: new Date() });
    await request(t.server).get('/api/players/mono').expect(404);
  });

  it('shows the status only for top-5 humans and never when hidden', async () => {
    const names = ['hu1', 'hu2', 'hu3', 'hu4', 'hu5', 'hu6'];
    for (const n of names) await register(t.server, n);
    for (const [i, n] of names.entries()) {
      await setUser(t.db, n, { balance: 60_000 - i * 1_000, statusText: `status ${n}` });
    }
    await setUser(t.db, 'hu2', { statusHiddenAt: new Date() });
    const { body } = await request(t.server).get('/api/leaderboard').expect(200);
    const status = Object.fromEntries(
      body.items.map((p: { nickname: string; status: string | null }) => [p.nickname, p.status]),
    );
    expect(status).toEqual({
      hu1: 'status hu1',
      hu2: null,
      hu3: 'status hu3',
      hu4: 'status hu4',
      hu5: 'status hu5',
      hu6: null,
    });
  });
});
