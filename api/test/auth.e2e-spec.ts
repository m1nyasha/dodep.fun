import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authFingerprints, sessions, settings, users } from '../src/db/schema.js';
import { createTestApp, PASSWORD, register, setUser, type TestApp } from './helpers.js';

describe('auth', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('registers, sets an httpOnly cookie and starts with 10 000', async () => {
    const res = await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'kletka17', password: PASSWORD, agree: true })
      .expect(204);
    const cookie = res.get('set-cookie')?.[0] ?? '';
    expect(cookie).toMatch(/^sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const me = await request(t.server)
      .get('/api/me')
      .set('Cookie', cookie.split(';')[0] ?? '')
      .expect(200);
    expect(me.body).toMatchObject({ nickname: 'kletka17', balance: 10_000, net: 0, roundsCount: 0, adminUrl: null });
  });

  it('rejects a taken nickname regardless of case', async () => {
    await register(t.server, 'Mono');
    const res = await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'mono', password: PASSWORD, agree: true })
      .expect(409);
    expect(res.body.code).toBe('NICKNAME_TAKEN');
  });

  it('validates the payload', async () => {
    await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'ab', password: PASSWORD, agree: true })
      .expect(400);
    await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'abc', password: 'short', agree: true })
      .expect(400);
    await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'abc', password: PASSWORD, agree: false })
      .expect(400);
    await request(t.server)
      .post('/api/auth/register')
      .send({ nickname: 'a b c', password: PASSWORD, agree: true })
      .expect(400);
  });

  it('logs in and out', async () => {
    await register(t.server, 'felix');
    const bad = await request(t.server)
      .post('/api/auth/login')
      .send({ nickname: 'felix', password: 'wrongpass1' })
      .expect(401);
    expect(bad.body.code).toBe('INVALID_CREDENTIALS');
    const missing = await request(t.server)
      .post('/api/auth/login')
      .send({ nickname: 'ghost', password: PASSWORD })
      .expect(401);
    expect(missing.body.code).toBe('INVALID_CREDENTIALS');

    const agent = request.agent(t.server);
    await agent.post('/api/auth/login').send({ nickname: 'FELIX', password: PASSWORD }).expect(204);
    await agent.get('/api/me').expect(200);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/me').expect(401);
  });

  it('refuses a blocked account', async () => {
    await register(t.server, 'tormoz');
    await setUser(t.db, 'tormoz', { blockedAt: new Date(), blockReason: 'spam' });
    const res = await request(t.server)
      .post('/api/auth/login')
      .send({ nickname: 'tormoz', password: PASSWORD })
      .expect(403);
    expect(res.body.code).toBe('ACCOUNT_BLOCKED');
  });

  it('limits registrations per IP within the window and records denials', async () => {
    await t.db
      .update(settings)
      .set({ value: { count: 2, windowHours: 24 } })
      .where(eq(settings.key, 'registration_limit'));
    await register(t.server, 'one', { ip: '10.1.1.1' });
    await register(t.server, 'two', { ip: '10.1.1.1' });
    const res = await request(t.server)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.1.1.1')
      .send({ nickname: 'three', password: PASSWORD, agree: true })
      .expect(403);
    expect(res.body).toEqual({
      code: 'REGISTRATION_UNAVAILABLE',
      message: 'Регистрация пока недоступна, повторите попытку позже',
    });
    await register(t.server, 'three', { ip: '10.1.1.2' });

    const denied = await t.db.select().from(authFingerprints).where(eq(authFingerprints.event, 'register_denied'));
    expect(denied).toHaveLength(1);
    expect(denied[0]).toMatchObject({ ip: '10.1.1.1', userId: null });
  });

  it('deletes the user expired sessions on a new login', async () => {
    await register(t.server, 'stale_sam');
    const [user] = await t.db.select().from(users).where(eq(users.nickname, 'stale_sam'));
    await t.db.insert(sessions).values({
      userId: user!.id,
      kind: 'user',
      tokenHash: 'expired-hash',
      expiresAt: new Date(Date.now() - 60_000),
    });

    await request(t.server).post('/api/auth/login').send({ nickname: 'stale_sam', password: PASSWORD }).expect(204);

    const left = await t.db.select().from(sessions).where(eq(sessions.tokenHash, 'expired-hash'));
    expect(left).toHaveLength(0);
  });

  it('stores a login fingerprint with client hash', async () => {
    await register(t.server, 'vera_k');
    await request(t.server)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '10.9.9.9')
      .set('User-Agent', 'test-agent')
      .send({ nickname: 'vera_k', password: PASSWORD, clientHash: 'a'.repeat(64) })
      .expect(204);
    const rows = await t.db.select().from(authFingerprints).where(eq(authFingerprints.event, 'login'));
    expect(rows[0]).toMatchObject({ ip: '10.9.9.9', userAgent: 'test-agent', clientHash: 'a'.repeat(64) });
  });
});
