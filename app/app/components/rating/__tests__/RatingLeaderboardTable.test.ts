// @vitest-environment nuxt
import type { LeaderboardDto, PlayerDto } from '@dodep/shared';
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import RatingLeaderboardTable from '../RatingLeaderboardTable.vue';

mockNuxtImport('useMe', () => () => ({ me: ref({ nickname: 'mono' }), isAuthed: ref(true) }));

const base: Omit<PlayerDto, 'nickname' | 'rank'> = {
  isAi: false,
  aiType: null,
  humanRank: null,
  isTop: false,
  balance: 10_000,
  net: 0,
  roundsCount: 3,
  status: null,
  createdAt: '2026-10-12T00:00:00.000Z',
};

describe('RatingLeaderboardTable', () => {
  it('renders tags, status and top classes', async () => {
    registerEndpoint('/api/leaderboard', (): LeaderboardDto => ({
      items: [
        { ...base, nickname: 'bot', rank: 1, isAi: true, aiType: 'Рисковый', balance: 30_000, net: 20_000 },
        { ...base, nickname: 'northstar', rank: 2, humanRank: 1, isTop: true, status: 'Сначала думай' },
        { ...base, nickname: 'mono', rank: 6, humanRank: 2, isTop: true, net: -500 },
      ],
      total: 40,
    }));
    const w = await mountSuspended(RatingLeaderboardTable);
    const rows = w.findAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.text()).toContain('AI');
    expect(rows[0]!.text()).toContain('Рисковый');
    expect(rows[0]!.classes()).toEqual(expect.arrayContaining(['is-top', 'is-top3']));
    expect(rows[0]!.text()).toContain('топ-1');
    expect(rows[1]!.classes()).toEqual(expect.arrayContaining(['is-top', 'is-top3']));
    expect(rows[1]!.text()).toContain('топ-2');
    expect(rows[1]!.text()).toContain('«Сначала думай»');
    expect(rows[2]!.classes()).toContain('is-me');
    expect(rows[2]!.text()).toContain('ты');
    expect(rows[2]!.classes()).not.toContain('is-top');
    expect(rows[2]!.classes()).not.toContain('is-top3');
    expect(rows[2]!.text()).not.toContain('топ-');
    expect(w.text()).toContain('Показать ещё · 37');
    expect(rows[1]!.find('a').attributes('href')).toBe('/players/northstar');
  });
});
