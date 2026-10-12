import type { MeDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMe } from '../useMe';

const me: MeDto = {
  nickname: 'kletka17',
  balance: 10_000,
  wagered: 0,
  payout: 0,
  net: 0,
  roundsCount: 0,
  rank: 1,
  humanRank: 1,
  status: null,
  statusHidden: false,
  nextDailyAt: '2026-10-13T09:00:00.000Z',
  dailyTarget: 10_000,
  adminUrl: null,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('useMe', () => {
  beforeEach(() => {
    useMe().me.value = null;
  });

  it('loads the current player', async () => {
    const unregister = registerEndpoint('/api/me', () => me);
    const { refresh, me: state, isAuthed } = useMe();
    await refresh();
    expect(state.value).toEqual(me);
    expect(isAuthed.value).toBe(true);
    unregister();
  });

  it('becomes anonymous on 401', async () => {
    const unregister = registerEndpoint('/api/me', () => json(401, { code: 'UNAUTHORIZED', message: 'Нужно войти' }));
    const { refresh, me: state } = useMe();
    state.value = me;
    await refresh();
    expect(state.value).toBeNull();
    unregister();
  });

  it('logs out', async () => {
    registerEndpoint('/api/auth/logout', { method: 'POST', handler: () => new Response(null, { status: 204 }) });
    const { logout, me: state } = useMe();
    state.value = me;
    await logout();
    expect(state.value).toBeNull();
  });
});
