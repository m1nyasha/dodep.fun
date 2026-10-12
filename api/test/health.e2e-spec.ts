import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createTestApp, type TestApp } from './helpers.js';

describe('health', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it('responds when the database is reachable', async () => {
    await request(t.server).get('/api/health').expect(200, { ok: true });
  });
});
