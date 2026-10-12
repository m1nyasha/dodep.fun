import type { ActiveRoundDto, FinishedRoundDto, MeDto, RulesDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGamePlay } from '../useGamePlay';
import { useMe } from '../useMe';
import { useRound } from '../useRound';
import { useRules } from '../useRules';

const rules: RulesDto = {
  version: 1,
  rtp: 0.973,
  minBet: 100,
  betStep: 100,
  startBalance: 10_000,
  dailyTarget: 10_000,
  cells: 25,
  mines: 5,
  ladder: [],
};

const me: MeDto = {
  nickname: 'zhenya',
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

const active: ActiveRoundDto = {
  id: 'r1',
  roundNo: 1,
  bet: 100,
  hash: 'h'.repeat(64),
  ruleVersion: 1,
  rtp: 0.973,
  opened: [],
  safeCount: 0,
  startedAt: '2026-10-12T09:00:00.000Z',
  status: 'active',
  multiplier: 1,
  potentialPayout: 100,
};

const openedOnce: ActiveRoundDto = { ...active, opened: [3], safeCount: 1, multiplier: 1.216, potentialPayout: 122 };

const lost: FinishedRoundDto = {
  ...openedOnce,
  status: 'hit_mine',
  endReason: 'mine',
  multiplier: 0,
  payout: 0,
  net: -100,
  hitCell: 4,
  mines: [4, 5, 6, 7, 8],
  salt: 's',
  finishedAt: '2026-10-12T09:01:00.000Z',
};

const cashed: FinishedRoundDto = {
  ...openedOnce,
  status: 'cashed_out',
  endReason: 'cash_out',
  multiplier: 1.216,
  payout: 122,
  net: 22,
  hitCell: null,
  mines: [4, 5, 6, 7, 8],
  salt: 's',
  finishedAt: '2026-10-12T09:01:00.000Z',
};

describe('useGamePlay', () => {
  beforeEach(() => {
    useRound().reset();
    useMe().me.value = { ...me };
    useRules().rules.value = { ...rules };
    localStorage.clear();
  });

  it('starts a round on press, updating balance and announcing it', async () => {
    registerEndpoint('/api/rounds', { method: 'POST', handler: () => ({ round: active, balance: 9_900 }) });
    const g = useGamePlay();
    expect(g.ctaMode.value).toBe('play');
    g.press();
    await vi.waitFor(() => expect(g.live.value).toBe(true));
    expect(useMe().me.value?.balance).toBe(9_900);
    expect(g.announce.value).toBe('Раунд начат, ставка 100.');
    expect(g.ctaMode.value).toBe('wait');
  });

  it('ignores a second start while the first is in flight', async () => {
    let calls = 0;
    registerEndpoint('/api/rounds', {
      method: 'POST',
      handler: async () => {
        calls++;
        await new Promise((r) => setTimeout(r, 10));
        return { round: active, balance: 9_900 };
      },
    });
    const g = useGamePlay();
    g.press();
    g.press();
    await vi.waitFor(() => expect(g.live.value).toBe(true));
    expect(calls).toBe(1);
  });

  it('opens a cell, switches cta to cash and announces the result', async () => {
    useRound().round.value = active;
    registerEndpoint('/api/rounds/r1/open', { method: 'POST', handler: () => ({ round: openedOnce, balance: 9_900 }) });
    const g = useGamePlay();
    await g.open(3);
    expect(g.live.value).toBe(true);
    expect(g.ctaMode.value).toBe('cash');
    expect(g.announce.value).toContain('Клетка 4: безопасно');
  });

  it('busy guard blocks opening a second cell while one is pending', async () => {
    useRound().round.value = active;
    let calls = 0;
    registerEndpoint('/api/rounds/r1/open', {
      method: 'POST',
      handler: async () => {
        calls++;
        await new Promise((r) => setTimeout(r, 10));
        return { round: openedOnce, balance: 9_900 };
      },
    });
    const g = useGamePlay();
    const p1 = g.open(3);
    const p2 = g.open(7);
    await Promise.all([p1, p2]);
    expect(calls).toBe(1);
  });

  it('loses on a mine: stamps the loss, shakes and announces it', async () => {
    useRound().round.value = openedOnce;
    registerEndpoint('/api/rounds/r1/open', { method: 'POST', handler: () => ({ round: lost, balance: 9_900 }) });
    registerEndpoint('/api/me', () => me);
    const g = useGamePlay();
    await g.open(4);
    expect(g.live.value).toBe(false);
    expect(g.stamp.value).toMatchObject({ kind: 'loss', big: '−100' });
    expect(g.announce.value).toBe('Мина на клетке 5. Ставка 100 сгорела.');
    await vi.waitFor(() => expect(g.shake.on.value).toBe(true));
    expect(useRecentRounds().items.value[0]?.id).toBe('r1');
  });

  it('cashes out: stamps the win and announces the payout', async () => {
    useRound().round.value = openedOnce;
    registerEndpoint('/api/rounds/r1/cash-out', {
      method: 'POST',
      handler: () => ({ round: cashed, balance: 10_022 }),
    });
    const g = useGamePlay();
    await g.cashOut();
    expect(g.stamp.value).toMatchObject({ kind: 'win', big: '+22' });
    expect(g.announce.value).toBe('Забрано 122 монет, множитель 1,22×.');
  });

  it('nudges instead of opening when no round is live', async () => {
    const g = useGamePlay();
    await g.open(0);
    await vi.waitFor(() => expect(g.nudge.on.value).toBe(true));
  });

  it('marks broke once the balance drops below the minimum bet', () => {
    useMe().me.value = { ...me, balance: 50 };
    const g = useGamePlay();
    expect(g.broke.value).toBe(true);
    expect(g.ctaMode.value).toBe('broke');
  });

  it('randomCell opens one of the free cells', async () => {
    useRound().round.value = active;
    registerEndpoint('/api/rounds/r1/open', { method: 'POST', handler: () => ({ round: openedOnce, balance: 9_900 }) });
    const g = useGamePlay();
    g.randomCell();
    await vi.waitFor(() => expect(g.round.value?.safeCount).toBe(1));
  });
});
