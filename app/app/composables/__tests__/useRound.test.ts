import type { ActiveRoundDto, FinishedRoundDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRound } from '../useRound';

const active: ActiveRoundDto = {
  id: 'r1',
  roundNo: 1,
  bet: 100,
  hash: 'h',
  ruleVersion: 1,
  rtp: 0.973,
  opened: [],
  safeCount: 0,
  startedAt: '2026-10-12T09:00:00.000Z',
  status: 'active',
  multiplier: 1,
  potentialPayout: 100,
};

const lost: FinishedRoundDto = {
  ...active,
  status: 'hit_mine',
  endReason: 'mine',
  multiplier: 0,
  payout: 0,
  net: -100,
  hitCell: 0,
  mines: [0, 1, 2, 3, 4],
  salt: 's',
  finishedAt: '2026-10-12T09:01:00.000Z',
};

describe('useRound', () => {
  beforeEach(() => useRound().reset());

  it('starts and finishes a round through the API', async () => {
    registerEndpoint('/api/rounds', { method: 'POST', handler: () => ({ round: active, balance: 9_900 }) });
    registerEndpoint('/api/rounds/r1/open', { method: 'POST', handler: () => ({ round: lost, balance: 9_900 }) });
    const game = useRound();
    expect((await game.start(100)).balance).toBe(9_900);
    expect(game.live.value).toBe(true);
    await game.open(0);
    expect(game.live.value).toBe(false);
    expect(game.round.value).toMatchObject({ status: 'hit_mine', hitCell: 0 });
  });

  it('restores an active round and keeps state when there is none', async () => {
    const unregister = registerEndpoint('/api/rounds/active', () => ({ round: active }));
    const game = useRound();
    await game.restore();
    expect(game.round.value?.id).toBe('r1');
    unregister();
    registerEndpoint('/api/rounds/active', () => ({ round: null }));
    await game.restore();
    expect(game.round.value?.id).toBe('r1');
  });
});
