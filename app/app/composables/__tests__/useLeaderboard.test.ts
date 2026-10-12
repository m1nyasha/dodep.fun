// @vitest-environment nuxt
import type { LeaderboardDto, PlayerDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useLeaderboard } from '../useLeaderboard';

const player = (nickname: string): PlayerDto => ({
  nickname,
  isAi: false,
  aiType: null,
  rank: 1,
  humanRank: 1,
  isTop: true,
  balance: 10_000,
  net: 0,
  roundsCount: 0,
  status: null,
  createdAt: '2026-10-12T00:00:00.000Z',
});

const queryOf = (event: { path?: string; url?: URL }) =>
  new URL(String(event.path ?? event.url), 'http://test').searchParams;

describe('useLeaderboard', () => {
  it('loads the first page, appends the next one and resets on filter change', async () => {
    const seen: string[] = [];
    registerEndpoint('/api/leaderboard', (event: { path?: string; url?: URL }): LeaderboardDto => {
      const q = queryOf(event);
      seen.push(`${q.get('filter')}:${q.get('offset')}:${q.get('limit')}`);
      const offset = Number(q.get('offset'));
      return { items: [player(`${q.get('filter')}-${offset}`)], total: 3 };
    });
    const filter = ref('all');
    const lb = useLeaderboard(filter, ref(''), 1);

    await lb.load(true);
    await lb.loadMore();
    expect(lb.items.value.map((p) => p.nickname)).toEqual(['all-0', 'all-1']);
    expect(lb.more.value).toBe(1);

    filter.value = 'ai';
    await vi.waitFor(() => expect(lb.items.value.map((p) => p.nickname)).toEqual(['ai-0']));
    expect(seen).toEqual(['all:0:1', 'all:1:25', 'ai:0:1']);
  });

  it('debounces the search and sends q', async () => {
    const qs: (string | null)[] = [];
    registerEndpoint('/api/leaderboard', (event: { path?: string; url?: URL }): LeaderboardDto => {
      qs.push(queryOf(event).get('q'));
      return { items: [], total: 0 };
    });
    const query = ref('');
    useLeaderboard(ref('all'), query);
    query.value = 'f';
    query.value = 'fe';
    query.value = 'fel';
    await vi.waitFor(() => expect(qs).toEqual(['fel']), { timeout: 1_000 });
  });
});
