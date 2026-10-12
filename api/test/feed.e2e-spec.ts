import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createTestApp, register, type TestApp } from './helpers.js';

function nextMessage(ws: WebSocket): Promise<{ event: string; data?: unknown }> {
  return new Promise((resolve) => ws.once('message', (raw) => resolve(JSON.parse(String(raw)))));
}

describe('feed', () => {
  let t: TestApp;
  let url: string;
  beforeAll(async () => {
    t = await createTestApp();
    await t.app.listen(0, '127.0.0.1');
    url = `ws://127.0.0.1:${(t.server.address() as AddressInfo).port}/api/ws`;
  });
  beforeEach(() => t.reset());
  afterAll(() => t.close());

  it('broadcasts finished rounds and serves recent ones', async () => {
    const ws = new WebSocket(url);
    await new Promise((resolve) => ws.once('open', resolve));
    const agent = await register(t.server, 'pixelpanda');
    const { body } = await agent.post('/api/rounds').send({ bet: 100 }).expect(201);
    const message = nextMessage(ws);
    await agent.post(`/api/rounds/${body.round.id}/open`).send({ cell: 0 }).expect(200);
    expect(await message).toMatchObject({
      event: 'round.finished',
      data: { type: 'round.finished', nickname: 'pixelpanda', isAi: false, safeCount: 0, win: false, net: -100 },
    });
    ws.close();

    const recent = await request(t.server).get('/api/feed').expect(200);
    expect(recent.body).toHaveLength(1);
    expect(recent.body[0]).toMatchObject({ nickname: 'pixelpanda', win: false, net: -100 });
  });

  it('answers ping with pong', async () => {
    const ws = new WebSocket(url);
    await new Promise((resolve) => ws.once('open', resolve));
    const message = nextMessage(ws);
    ws.send(JSON.stringify({ event: 'ping' }));
    expect(await message).toEqual({ event: 'pong' });
    ws.close();
  });

  it('disconnects a client sending an oversized frame but keeps ping/pong working for others', async () => {
    const bad = new WebSocket(url);
    await new Promise((resolve) => bad.once('open', resolve));
    const closed = new Promise<number>((resolve) => bad.once('close', (code) => resolve(code)));
    bad.send('x'.repeat(5_000));
    expect(await closed).toBe(1009);

    const ok = new WebSocket(url);
    await new Promise((resolve) => ok.once('open', resolve));
    const message = nextMessage(ok);
    ok.send(JSON.stringify({ event: 'ping' }));
    expect(await message).toEqual({ event: 'pong' });
    ok.close();
  });
});
