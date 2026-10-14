// @vitest-environment nuxt
import type { LeaderboardDto, PlayerDto } from '@dodep/shared';
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { clearNuxtData } from '#imports';
import Rating from '../rating.vue';

mockNuxtImport('useMe', () => () => ({ me: ref(null) }));

describe('rating page', () => {
  it('includes AI leaders in the podium fetched from the leaderboard', async () => {
    clearNuxtData('podium');
    const robot: PlayerDto = {
      nickname: 'robot',
      isAi: true,
      aiType: 'Рисковый',
      rank: 1,
      humanRank: null,
      isTop: false,
      balance: 30_000,
      net: 0,
      roundsCount: 3,
      status: null,
      createdAt: '2026-10-12T00:00:00.000Z',
    };
    registerEndpoint('/api/leaderboard', (event): LeaderboardDto => {
      const query = new URL(event.path, 'http://localhost').searchParams;
      return { items: query.get('filter') === 'human' ? [] : [robot], total: 1 };
    });
    const w = await mountSuspended(Rating, {
      global: { stubs: { RatingLeaderboardTable: true, RatingNumbers: true, RatingAiDotplot: true } },
    });
    expect(w.findAll('.pod')).toHaveLength(1);
    expect(w.find('.pod .name').text()).toBe('robot');
    expect(w.find('.pod .place').text()).toBe('1');
  });
});
