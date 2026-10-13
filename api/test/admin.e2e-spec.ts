import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { adminActions, ledger, ruleVersions, rounds, sessions, users } from '../src/db/schema.js';
import { createTestApp, PASSWORD, register, setUser, type TestApp } from './helpers.js';

async function ticketFor(t: TestApp, nickname: string) {
  const user = await register(t.server, nickname);
  await setUser(t.db, nickname, { isAdmin: true });
  const { body } = await user.post('/api/me/admin-ticket').expect(200);
  const url = new URL(body.url);
  const ticket = url.searchParams.get('ticket');
  if (ticket === null) throw new Error('admin-ticket response had no ticket param');
  return { user, url, ticket };
}

export async function loginAdmin(t: TestApp, nickname = 'boss') {
  const { user, ticket } = await ticketFor(t, nickname);
  const admin = request.agent(t.server);
  await admin.post('/api/admin/auth/exchange').send({ ticket }).expect(200);
  return { user, admin };
}

describe('admin auth', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('issues a ticket link to the admin subdomain', async () => {
    const { url, ticket } = await ticketFor(t, 'boss');
    expect(`${url.origin}${url.pathname}`).toBe('http://admin.test/auth');
    expect(ticket.length).toBeGreaterThan(30);
  });

  it('refuses tickets to non-admins', async () => {
    const user = await register(t.server, 'mono');
    const res = await user.post('/api/me/admin-ticket').expect(403);
    expect(res.body.code).toBe('ADMIN_ONLY');
  });

  it('exchanges a ticket once for a strict admin cookie', async () => {
    const { ticket } = await ticketFor(t, 'boss');
    const res = await request(t.server).post('/api/admin/auth/exchange').send({ ticket }).expect(200);
    expect(res.body).toEqual({ nickname: 'boss' });
    const cookie = res.get('set-cookie')?.[0] ?? '';
    expect(cookie).toMatch(/^admin_sid=/);
    expect(cookie).toMatch(/Path=\/api\/admin/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).not.toMatch(/Domain=/i);

    const again = await request(t.server).post('/api/admin/auth/exchange').send({ ticket }).expect(401);
    expect(again.body.code).toBe('TICKET_INVALID');
  });

  it('rejects an expired ticket', async () => {
    const { ticket } = await ticketFor(t, 'boss');
    await t.db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(sessions.kind, 'admin_ticket'));
    await request(t.server).post('/api/admin/auth/exchange').send({ ticket }).expect(401);
  });

  it('refuses a ticket from a blocked admin', async () => {
    const { ticket } = await ticketFor(t, 'boss');
    await setUser(t.db, 'boss', { blockedAt: new Date() });
    const res = await request(t.server).post('/api/admin/auth/exchange').send({ ticket }).expect(401);
    expect(res.body.code).toBe('TICKET_INVALID');
  });

  it('exchanges a ticket exactly once under concurrent requests', async () => {
    const { ticket } = await ticketFor(t, 'boss');
    const results = await Promise.all(
      Array.from({ length: 5 }, () => request(t.server).post('/api/admin/auth/exchange').send({ ticket })),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 401)).toHaveLength(4);
  });

  it('rejects a public session token presented as admin_sid', async () => {
    const res = await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'plainuser', password: PASSWORD, agree: true })
      .expect(204);
    const sidCookie = res.get('Set-Cookie')?.find((c) => c.startsWith('sid='));
    if (!sidCookie) throw new Error('register did not set a sid cookie');
    const sidToken = /sid=([^;]+)/.exec(sidCookie)?.[1];
    if (!sidToken) throw new Error('sid cookie had no value');
    await request(t.server).get('/api/admin/me').set('Cookie', `admin_sid=${sidToken}`).expect(401);
  });

  it('opens the admin API only with admin_sid', async () => {
    const { user, admin } = await loginAdmin(t);
    await user.get('/api/admin/me').expect(401);
    await request(t.server).get('/api/admin/me').expect(401);
    expect((await admin.get('/api/admin/me').expect(200)).body).toEqual({ nickname: 'boss' });
  });

  it('drops admin access when the admin flag is removed', async () => {
    const { admin } = await loginAdmin(t);
    await setUser(t.db, 'boss', { isAdmin: false });
    await admin.get('/api/admin/me').expect(401);
  });

  it('logs out', async () => {
    const { admin } = await loginAdmin(t);
    await admin.post('/api/admin/auth/logout').expect(204);
    await admin.get('/api/admin/me').expect(401);
  });

  it('serves the admin Swagger only to admins and keeps it out of the public one', async () => {
    await request(t.server).get('/api/admin/docs-json').expect(401);
    const { admin } = await loginAdmin(t);
    const adminDoc = await admin.get('/api/admin/docs-json').expect(200);
    expect(Object.keys(adminDoc.body.paths)).toContain('/api/admin/me');
    const publicDoc = await request(t.server).get('/api/docs-json').expect(200);
    expect(Object.keys(publicDoc.body.paths).some((p) => p.startsWith('/api/admin'))).toBe(false);
  });

  it('keeps the Swagger gate case-insensitive', async () => {
    await request(t.server).get('/api/admin/Docs-json').expect(401);
    await request(t.server).get('/api/admin/DOCS').expect(401);
  });
});

describe('admin overview and audit', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('counts accounts and shows the active rules', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'bot');
    await setUser(t.db, 'bot', { isAi: true });
    await register(t.server, 'quiet');
    await setUser(t.db, 'quiet', { blockedAt: new Date(), statusText: 'x', statusHiddenAt: new Date() });
    const { body } = await admin.get('/api/admin/overview').expect(200);
    expect(body).toMatchObject({
      accounts: 3,
      aiAccounts: 1,
      blocked: 1,
      hiddenStatuses: 1,
      rounds: 0,
      activeRuleVersion: 1,
      recentActions: [],
    });
  });

  it('pages the audit log newest first', async () => {
    const { admin } = await loginAdmin(t);
    const { AuditService } = await import('../src/admin/audit.service.js');
    const audit = t.app.get(AuditService);
    const [boss] = await t.db.select().from(users);
    if (boss === undefined) throw new Error('expected a seeded admin user');
    await audit.log(t.db, { adminId: boss.id, action: 'settings_update', reason: 'первое' });
    await audit.log(t.db, { adminId: boss.id, action: 'settings_update', reason: 'второе' });
    const { body } = await admin.get('/api/admin/audit?limit=1').expect(200);
    expect(body.total).toBe(2);
    expect(body.items).toEqual([
      expect.objectContaining({ action: 'settings_update', admin: 'boss', target: null, reason: 'второе' }),
    ]);
  });
});

describe('admin accounts and statuses', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('searches accounts', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'kletka17');
    await register(t.server, 'mono');
    const { body } = await admin.get('/api/admin/accounts?q=LETK').expect(200);
    expect(body.total).toBe(1);
    expect(body.items[0]).toMatchObject({
      nickname: 'kletka17',
      isAi: false,
      isAdmin: false,
      balance: 10_000,
      blockedAt: null,
    });
  });

  it('shows fingerprints and accounts sharing an IP or client hash', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'main', { ip: '10.5.5.5' });
    await register(t.server, 'twin', { ip: '10.5.5.5' });
    await register(t.server, 'clone', { ip: '10.6.6.6' });
    await request(t.server)
      .post('/api/auth/login')
      .send({ nickname: 'main', password: 'password123', clientHash: 'c'.repeat(64) })
      .expect(204);
    await request(t.server)
      .post('/api/auth/login')
      .send({ nickname: 'clone', password: 'password123', clientHash: 'c'.repeat(64) })
      .expect(204);

    const { body } = await admin.get('/api/admin/accounts/main').expect(200);
    expect(body.account.nickname).toBe('main');
    expect(body.fingerprints.map((f: { event: string }) => f.event).sort()).toEqual(['login', 'register']);
    expect(body.related).toEqual(
      expect.arrayContaining([
        { nickname: 'twin', via: 'ip', value: '10.5.5.5', blocked: false },
        { nickname: 'clone', via: 'client', value: 'c'.repeat(64), blocked: false },
      ]),
    );
    expect((await admin.get('/api/admin/accounts/ghost').expect(404)).body.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('blocks with a reason, revokes every session and hides from the leaderboard', async () => {
    const { admin } = await loginAdmin(t);
    const victim = await register(t.server, 'tormoz');
    await admin.post('/api/admin/accounts/tormoz/block').send({ reason: '' }).expect(400);
    const { body } = await admin
      .post('/api/admin/accounts/tormoz/block')
      .send({ reason: 'спам статусами' })
      .expect(200);
    expect(body).toMatchObject({ nickname: 'tormoz', blockReason: 'спам статусами' });
    expect(body.blockedAt).not.toBeNull();

    await victim.get('/api/me').expect(401);
    const board = await request(t.server).get('/api/leaderboard').expect(200);
    expect(board.body.items.map((p: { nickname: string }) => p.nickname)).not.toContain('tormoz');

    const audit = await admin.get('/api/admin/audit').expect(200);
    expect(audit.body.items[0]).toMatchObject({ action: 'block', target: 'tormoz', reason: 'спам статусами' });

    await admin.post('/api/admin/accounts/tormoz/unblock').send({ reason: 'разобрались' }).expect(200);
    await request(t.server).post('/api/auth/login').send({ nickname: 'tormoz', password: 'password123' }).expect(204);
  });

  it('revokes another admin session on block and forbids blocking yourself', async () => {
    const { admin } = await loginAdmin(t, 'boss');
    const { admin: other } = await loginAdmin(t, 'deputy');
    await other.get('/api/admin/me').expect(200);
    await admin.post('/api/admin/accounts/deputy/block').send({ reason: 'утечка' }).expect(200);
    await other.get('/api/admin/me').expect(401);
    expect((await admin.post('/api/admin/accounts/boss/block').send({ reason: 'x' }).expect(400)).body.code).toBe(
      'SELF_ACTION',
    );
  });

  it('hides and shows a public status with a reason', async () => {
    const { admin } = await loginAdmin(t);
    const top = await register(t.server, 'northstar');
    await setUser(t.db, 'northstar', { balance: 90_000 });
    await top.put('/api/me/status').send({ text: 'Сначала думай' }).expect(200);

    const list = await admin.get('/api/admin/statuses').expect(200);
    expect(list.body).toEqual([
      expect.objectContaining({ nickname: 'northstar', text: 'Сначала думай', hiddenAt: null, humanRank: 1 }),
    ]);

    await admin.post('/api/admin/statuses/northstar/hide').send({ reason: '' }).expect(400);
    const hidden = await admin.post('/api/admin/statuses/northstar/hide').send({ reason: 'оскорбление' }).expect(200);
    expect(hidden.body.hiddenAt).not.toBeNull();
    expect((await request(t.server).get('/api/players/northstar').expect(200)).body.status).toBeNull();

    await admin.post('/api/admin/statuses/northstar/show').send({ reason: 'ошибка' }).expect(200);
    expect((await request(t.server).get('/api/players/northstar').expect(200)).body.status).toBe('Сначала думай');
  });
});

describe('admin coin adjustment', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('credits coins, writes a ledger row and an audit row without touching net', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'payee');

    const res = await admin.post('/api/admin/accounts/payee/coins').send({ amount: 500, reason: 'бонус' }).expect(200);
    expect(res.body).toMatchObject({ nickname: 'payee', balance: 10_500, net: 0 });

    const [row] = await t.db.select().from(users).where(eq(users.nickname, 'payee'));
    if (!row) throw new Error('expected payee');
    expect(row.totalWagered).toBe(0);
    expect(row.totalPayout).toBe(0);

    const ledgerRows = await t.db.select().from(ledger).where(eq(ledger.userId, row.id));
    expect(ledgerRows.filter((l) => l.kind === 'admin')).toMatchObject([
      { kind: 'admin', amount: 500, balanceBefore: 10_000, balanceAfter: 10_500 },
    ]);

    const audit = await admin.get('/api/admin/audit').expect(200);
    expect(audit.body.items[0]).toMatchObject({
      action: 'coins_adjust',
      target: 'payee',
      reason: 'бонус',
      payload: { amount: 500, balanceBefore: 10_000, balanceAfter: 10_500 },
    });
  });

  it('debits coins', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'debtor');
    const res = await admin
      .post('/api/admin/accounts/debtor/coins')
      .send({ amount: -1000, reason: 'штраф' })
      .expect(200);
    expect(res.body.balance).toBe(9_000);
  });

  it('rejects a debit that would push the balance below zero, leaving balance/ledger/audit untouched', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'poor');
    const [before] = await t.db.select().from(users).where(eq(users.nickname, 'poor'));
    if (!before) throw new Error('expected poor');
    const ledgerBefore = await t.db.select().from(ledger).where(eq(ledger.userId, before.id));
    const actionsBefore = await t.db.select().from(adminActions).where(eq(adminActions.targetUserId, before.id));

    const res = await admin.post('/api/admin/accounts/poor/coins').send({ amount: -20_000, reason: 'x' }).expect(400);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');

    const [after] = await t.db.select().from(users).where(eq(users.nickname, 'poor'));
    expect(after?.balance).toBe(before.balance);
    expect(await t.db.select().from(ledger).where(eq(ledger.userId, before.id))).toHaveLength(ledgerBefore.length);
    expect(await t.db.select().from(adminActions).where(eq(adminActions.targetUserId, before.id))).toHaveLength(
      actionsBefore.length,
    );
  });

  it('rejects an adjustment while a round is active, leaving balance/ledger/audit untouched', async () => {
    const { admin } = await loginAdmin(t);
    const player = await register(t.server, 'busy');
    await player.post('/api/rounds').send({ bet: 100 }).expect(201);
    const [before] = await t.db.select().from(users).where(eq(users.nickname, 'busy'));
    if (!before) throw new Error('expected busy');
    const ledgerBefore = await t.db.select().from(ledger).where(eq(ledger.userId, before.id));
    const actionsBefore = await t.db.select().from(adminActions).where(eq(adminActions.targetUserId, before.id));

    const res = await admin.post('/api/admin/accounts/busy/coins').send({ amount: 100, reason: 'x' }).expect(409);
    expect(res.body.code).toBe('ROUND_ACTIVE');

    const [after] = await t.db.select().from(users).where(eq(users.nickname, 'busy'));
    expect(after?.balance).toBe(before.balance);
    expect(await t.db.select().from(ledger).where(eq(ledger.userId, before.id))).toHaveLength(ledgerBefore.length);
    expect(await t.db.select().from(adminActions).where(eq(adminActions.targetUserId, before.id))).toHaveLength(
      actionsBefore.length,
    );
  });

  it('validates the amount and the reason', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'val');
    await admin.post('/api/admin/accounts/val/coins').send({ amount: 0, reason: 'x' }).expect(400);
    await admin.post('/api/admin/accounts/val/coins').send({ amount: 1_000_000_001, reason: 'x' }).expect(400);
    await admin.post('/api/admin/accounts/val/coins').send({ amount: -1_000_000_001, reason: 'x' }).expect(400);
    await admin.post('/api/admin/accounts/val/coins').send({ amount: 100, reason: '' }).expect(400);
  });

  it('allows adjusting a blocked account', async () => {
    const { admin } = await loginAdmin(t);
    await register(t.server, 'blocked1');
    await admin.post('/api/admin/accounts/blocked1/block').send({ reason: 'спам' }).expect(200);
    const res = await admin.post('/api/admin/accounts/blocked1/coins').send({ amount: 100, reason: 'x' }).expect(200);
    expect(res.body.balance).toBe(10_100);
  });

  it('404s for an unknown nickname', async () => {
    const { admin } = await loginAdmin(t);
    const res = await admin.post('/api/admin/accounts/ghost/coins').send({ amount: 100, reason: 'x' }).expect(404);
    expect(res.body.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('requires an admin session', async () => {
    await register(t.server, 'anon');
    await request(t.server).post('/api/admin/accounts/anon/coins').send({ amount: 100, reason: 'x' }).expect(401);
  });

  it('rejects a signed-in non-admin player (public sid cookie only)', async () => {
    const player = await register(t.server, 'commoner');
    await player.post('/api/admin/accounts/commoner/coins').send({ amount: 100, reason: 'x' }).expect(401);
  });
});

describe('admin rules', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(async () => {
    await t.db.update(ruleVersions).set({ isActive: false }).where(eq(ruleVersions.isActive, true));
    await t.db.update(ruleVersions).set({ isActive: true }).where(eq(ruleVersions.version, 1));
    await t.close();
  });

  it('creates an inactive version and activates it for new rounds only', async () => {
    const { admin } = await loginAdmin(t);
    const player = await register(t.server, 'ply1');
    const before = await player.post('/api/rounds').send({ bet: 100 }).expect(201);

    await admin
      .post('/api/admin/rules')
      .send({ rtp: 0.95, minBet: 150, betStep: 100, startBalance: 10_000, dailyTarget: 10_000 })
      .expect(400);
    const created = await admin
      .post('/api/admin/rules')
      .send({ rtp: 0.95, minBet: 200, betStep: 100, startBalance: 10_000, dailyTarget: 10_000, reason: 'эксперимент' })
      .expect(201);
    const v = created.body.version as number;
    expect(created.body).toMatchObject({ rtp: 0.95, minBet: 200, isActive: false, createdBy: 'boss' });

    await admin.post(`/api/admin/rules/${v}/activate`).send({}).expect(200);
    const list = await admin.get('/api/admin/rules').expect(200);
    expect(
      list.body.filter((r: { isActive: boolean }) => r.isActive).map((r: { version: number }) => r.version),
    ).toEqual([v]);
    expect((await request(t.server).get('/api/rules').expect(200)).body).toMatchObject({
      version: v,
      rtp: 0.95,
      minBet: 200,
    });

    await player.post(`/api/rounds/${before.body.round.id}/open`).send({ cell: 10 }).expect(200);
    const cashed = await player.post(`/api/rounds/${before.body.round.id}/cash-out`).expect(200);
    expect(cashed.body.round).toMatchObject({ ruleVersion: 1, rtp: 0.973, payout: 122 });
    const next = await player.post('/api/rounds').send({ bet: 200 }).expect(201);
    expect(next.body.round.ruleVersion).toBe(v);

    expect((await admin.post('/api/admin/rules/999/activate').send({}).expect(404)).body.code).toBe('RULE_NOT_FOUND');
    const audit = await admin.get('/api/admin/audit').expect(200);
    expect(audit.body.items.map((a: { action: string }) => a.action).slice(0, 2)).toEqual([
      'rules_activate',
      'rules_create',
    ]);
  });

  it('serializes concurrent creates into distinct versions', async () => {
    const { admin } = await loginAdmin(t);
    const before = await admin.get('/api/admin/rules').expect(200);
    const maxVersion = Math.max(0, ...before.body.map((r: { version: number }) => r.version));
    const payload = { rtp: 0.95, minBet: 100, betStep: 100, startBalance: 10_000, dailyTarget: 10_000 };
    const [a, b] = await Promise.all([
      admin.post('/api/admin/rules').send(payload),
      admin.post('/api/admin/rules').send(payload),
    ]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    const versions = [a.body.version as number, b.body.version as number].sort((x, y) => x - y);
    expect(versions).toEqual([maxVersion + 1, maxVersion + 2]);
  });

  it('serializes concurrent activations to exactly one active version', async () => {
    const { admin } = await loginAdmin(t);
    const payload = { rtp: 0.95, minBet: 100, betStep: 100, startBalance: 10_000, dailyTarget: 10_000 };
    const first = await admin.post('/api/admin/rules').send(payload).expect(201);
    const second = await admin.post('/api/admin/rules').send(payload).expect(201);
    const [a, b] = await Promise.all([
      admin.post(`/api/admin/rules/${first.body.version}/activate`).send({}),
      admin.post(`/api/admin/rules/${second.body.version}/activate`).send({}),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 200]);
    const list = await admin.get('/api/admin/rules').expect(200);
    const active = list.body.filter((r: { isActive: boolean }) => r.isActive);
    expect(active).toHaveLength(1);
    expect([first.body.version, second.body.version]).toContain(active[0].version);
  });
});

describe('admin registration limit', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('reads, validates and applies the limit', async () => {
    const { admin } = await loginAdmin(t);
    expect((await admin.get('/api/admin/settings/registration-limit').expect(200)).body).toEqual({
      count: 1000,
      windowHours: 24,
    });
    await admin.put('/api/admin/settings/registration-limit').send({ count: 0, windowHours: 24 }).expect(400);
    await admin.put('/api/admin/settings/registration-limit').send({ count: 1, windowHours: 1000 }).expect(400);
    const saved = await admin
      .put('/api/admin/settings/registration-limit')
      .send({ count: 1, windowHours: 2, reason: 'наплыв' })
      .expect(200);
    expect(saved.body).toEqual({ count: 1, windowHours: 2 });

    await register(t.server, 'first', { ip: '10.7.7.7' });
    const res = await request(t.server)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.7.7.7')
      .send({ nickname: 'second', password: 'password123', agree: true })
      .expect(403);
    expect(res.body.code).toBe('REGISTRATION_UNAVAILABLE');

    const audit = await admin.get('/api/admin/audit').expect(200);
    expect(audit.body.items[0]).toMatchObject({
      action: 'settings_update',
      reason: 'наплыв',
      payload: { count: 1, windowHours: 2 },
    });
  });
});

describe('admin:grant', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('grants and revokes the admin flag by nickname', async () => {
    const { setAdmin } = await import('../src/cli/admin-grant.js');
    const user = await register(t.server, 'Kletka17');
    expect(await setAdmin(t.db, 'kletka17', true)).toBe(true);
    expect((await user.get('/api/me').expect(200)).body.adminUrl).toBe('http://admin.test');
    expect(await setAdmin(t.db, 'kletka17', false)).toBe(true);
    expect((await user.get('/api/me').expect(200)).body.adminUrl).toBeNull();
    expect(await setAdmin(t.db, 'ghost', true)).toBe(false);
  });
});

describe('admin export', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('exports finished rounds and their actions as CSV and JSON', async () => {
    const { admin } = await loginAdmin(t);
    const player = await register(t.server, 'playerone');
    const { body } = await player.post('/api/rounds').send({ bet: 100 }).expect(201);
    await player.post(`/api/rounds/${body.round.id}/open`).send({ cell: 10 }).expect(200);
    await player.post(`/api/rounds/${body.round.id}/open`).send({ cell: 0 }).expect(200);
    await player.post('/api/rounds').send({ bet: 100 }).expect(201);

    const csv = await admin.get('/api/admin/export?kind=rounds&format=csv').expect(200);
    expect(csv.get('content-type')).toMatch(/text\/csv/);
    expect(csv.get('content-disposition')).toMatch(/attachment; filename="dodep-rounds-/);
    const { BOM } = await import('../src/admin/csv.js');
    const lines = csv.text.replace(BOM, '').trim().split('\r\n');
    expect(lines[0]).toBe(
      'id,nickname,isAi,aiType,experimentId,ruleVersion,roundNo,bet,balanceBefore,balanceAfter,status,endReason,safeCount,multiplier,payout,hitCell,startedAt,finishedAt',
    );
    expect(lines).toHaveLength(2);

    const actions = await admin.get('/api/admin/export?kind=actions&format=json').expect(200);
    expect(actions.body.map((a: { seq: number; result: string }) => [a.seq, a.result])).toEqual([
      [1, 'safe'],
      [2, 'mine'],
    ]);
    expect((await admin.get('/api/admin/export?kind=rounds&format=json&isAi=true').expect(200)).body).toEqual([]);
    expect(
      (await admin.get('/api/admin/export?kind=rounds&format=json&from=2000-01-01&to=2000-01-02').expect(200)).body,
    ).toEqual([]);
    await admin.get('/api/admin/export?from=yesterday').expect(400);
  });

  it('filters by finishedAt, not startedAt, so a round started before the window but finished inside it is included', async () => {
    const { admin } = await loginAdmin(t);
    const player = await register(t.server, 'playertwo');
    const { body } = await player.post('/api/rounds').send({ bet: 100 }).expect(201);
    await t.db
      .update(rounds)
      .set({ startedAt: new Date('2000-01-01T00:00:00Z') })
      .where(eq(rounds.id, body.round.id));
    await player.post(`/api/rounds/${body.round.id}/open`).send({ cell: 0 }).expect(200);

    const today = new Date().toISOString().slice(0, 10);
    const windowed = await admin.get(`/api/admin/export?kind=rounds&format=json&from=${today}&to=${today}`).expect(200);
    expect(windowed.body.map((r: { id: string }) => r.id)).toEqual([body.round.id]);

    const excluded = await admin
      .get('/api/admin/export?kind=rounds&format=json&from=2000-01-01&to=2000-01-02')
      .expect(200);
    expect(excluded.body).toEqual([]);
  });
});
