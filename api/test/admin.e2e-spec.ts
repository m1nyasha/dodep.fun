import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sessions } from '../src/db/schema.js';
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
    await t.db.update(sessions).set({ expiresAt: new Date(Date.now() - 1_000) }).where(eq(sessions.kind, 'admin_ticket'));
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
