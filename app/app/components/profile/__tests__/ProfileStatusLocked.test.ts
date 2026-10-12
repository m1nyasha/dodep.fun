// @vitest-environment nuxt
import type { LeaderboardDto, PlayerDto } from '@dodep/shared';
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import ProfileStatusLocked from '../ProfileStatusLocked.vue';

describe('ProfileStatusLocked', () => {
  it('tells how many coins are missing to the fifth human', async () => {
    registerEndpoint('/api/leaderboard', (): LeaderboardDto => ({
      items: [{ nickname: 'sasha_t', balance: 15_200 } as PlayerDto],
      total: 10,
    }));
    const w = await mountSuspended(ProfileStatusLocked, {
      props: { player: { nickname: 'mono', humanRank: 8, balance: 10_000 } as PlayerDto },
    });
    expect(w.text()).toContain('8-й среди людей');
    expect(w.get('.gap').text()).toMatch(/5\s?201/);
    expect(w.get('.bar i').attributes('style')).toMatch(/--w: 65\.7\d*%/);
  });
});
