import type { MeDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDaily } from '../useDaily';
import { useMe } from '../useMe';

const base: MeDto = {
  nickname: 'zhenya',
  balance: 300,
  wagered: 0,
  payout: 0,
  net: 0,
  roundsCount: 0,
  rank: 1,
  humanRank: 1,
  status: null,
  statusHidden: false,
  nextDailyAt: new Date(Date.now() - 60_000).toISOString(),
  dailyTarget: 10_000,
  adminUrl: null,
};

describe('useDaily', () => {
  beforeEach(() => {
    useMe().me.value = { ...base };
  });

  it('is available when the balance is low and the time has come', () => {
    const { available, text } = useDaily();
    expect(available.value).toBe(true);
    expect(text.value).toBe('Можно добрать 9 700 монет.');
  });

  it('waits for the next window', () => {
    useMe().me.value = { ...base, nextDailyAt: new Date(Date.now() + 90 * 60_000 + 1_000).toISOString() };
    const { available, text } = useDaily();
    expect(available.value).toBe(false);
    expect(text.value).toBe('Следующая выдача через 1 ч 31 мин.');
  });

  it('is closed at the target balance and for guests', () => {
    useMe().me.value = { ...base, balance: 10_000 };
    expect(useDaily().text.value).toBe('Откроется, когда баланс опустится ниже 10 000.');
    useMe().me.value = null;
    expect(useDaily().available.value).toBe(false);
    expect(useDaily().text.value).toBe('После входа — до 10 000 монет каждый день в 12:00 МСК.');
  });

  it('claims and tops the balance up', async () => {
    registerEndpoint('/api/me/daily', {
      method: 'POST',
      handler: () => ({ balance: 10_000, added: 9_700, nextDailyAt: '2026-10-14T09:00:00.000Z' }),
    });
    await useDaily().claim();
    expect(useMe().me.value).toMatchObject({ balance: 10_000, nextDailyAt: '2026-10-14T09:00:00.000Z' });
  });
});
