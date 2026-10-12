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

  it('claims the daily coins only when the balance is low and the window is open', async () => {
    const agent = await register(t.server, 'zhenya');
    expect((await agent.post('/api/me/daily').expect(400)).body.code).toBe('DAILY_UNAVAILABLE');

    await setUser(t.db, 'zhenya', { balance: 300, lastDailyAt: new Date(Date.now() - 3 * 24 * 3_600_000) });
    const claim = await agent.post('/api/me/daily').expect(200);
    expect(claim.body).toMatchObject({ balance: 10_000, added: 9_700 });
    expect(new Date(claim.body.nextDailyAt).getTime()).toBeGreaterThan(Date.now());

    await setUser(t.db, 'zhenya', { balance: 300 });
    expect((await agent.post('/api/me/daily').expect(400)).body.code).toBe('DAILY_UNAVAILABLE');
  });

  it('refuses the daily claim while a round is active even with a zero balance', async () => {
    const agent = await register(t.server, 'exploiter');
    await setUser(t.db, 'exploiter', { lastDailyAt: new Date(Date.now() - 3 * 24 * 3_600_000) });
    await agent.post('/api/rounds').send({ bet: 10_000 }).expect(201);

    const claim = await agent.post('/api/me/daily').expect(400);
    expect(claim.body.code).toBe('DAILY_UNAVAILABLE');

    const me = await agent.get('/api/me').expect(200);
    expect(me.body.balance).toBe(0);
  });

  // NOTE: brief used 2-char nicknames (s1..s6), which fail the 3-20 char nickname regex. Renamed to st1..st6.
  it('lets only top-5 humans publish a cleaned status', async () => {
    const names = ['st1', 'st2', 'st3', 'st4', 'st5', 'st6'];
    const a1 = await register(t.server, 'st1');
    const a6 = await register(t.server, 'st6');
    for (const n of ['st2', 'st3', 'st4', 'st5']) await register(t.server, n);
    for (const [i, n] of names.entries()) await setUser(t.db, n, { balance: 60_000 - i * 1_000 });

    const ok = await a1.put('/api/me/status').send({ text: '  Сначала  думай https://spam.io ' }).expect(200);
    expect(ok.body.status).toBe('Сначала думай');
    const card = await request(t.server).get('/api/players/st1').expect(200);
    expect(card.body.status).toBe('Сначала думай');

    expect((await a6.put('/api/me/status').send({ text: 'hi' }).expect(403)).body.code).toBe('STATUS_FORBIDDEN');
    const cleared = await a1.put('/api/me/status').send({ text: '   ' }).expect(200);
    expect(cleared.body.status).toBeNull();
  });

  it('summarizes humans and AI separately', async () => {
    await register(t.server, 'human1');
    await register(t.server, 'bot1');
    await setUser(t.db, 'human1', { balance: 12_000, totalWagered: 1_000, totalPayout: 3_000, roundsCount: 4 });
    await setUser(t.db, 'bot1', { balance: 0, isAi: true, totalWagered: 10_000, totalPayout: 0, roundsCount: 9 });
    const human = await request(t.server).get('/api/stats?scope=human').expect(200);
    expect(human.body).toMatchObject({
      scope: 'human',
      accounts: 1,
      rounds: 4,
      rtp: 3,
      profitableShare: 1,
      medianBalance: 12_000,
    });
    const ai = await request(t.server).get('/api/stats?scope=ai').expect(200);
    expect(ai.body).toMatchObject({
      scope: 'ai',
      accounts: 1,
      rounds: 9,
      rtp: 0,
      profitableShare: 0,
      medianBalance: 0,
    });
  });
});
