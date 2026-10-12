import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sessions, users } from '../src/db/schema.js';
import { createTestApp, register, setUser, type TestApp } from './helpers.js';

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
