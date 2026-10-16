// @vitest-environment nuxt
import type { LeaderboardDto, PlayerDto, RulesDto } from '@dodep/shared';
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearNuxtData, fmt } from '#imports';
import RatingAiDotplot from '../RatingAiDotplot.vue';

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
const ai = (nickname: string, aiType: string, balance: number): PlayerDto => ({
  nickname,
  isAi: true,
  aiType,
  rank: 1,
  humanRank: null,
  isTop: false,
  balance,
  net: balance - 10_000,
  roundsCount: 50,
  status: null,
  createdAt: '2026-10-12T00:00:00.000Z',
});

describe('RatingAiDotplot', () => {
  beforeEach(() => {
    clearNuxtData(['rules', 'ai-players']);
  });

  it('shows an empty state without AI accounts', async () => {
    registerEndpoint('/api/rules', () => rules);
    registerEndpoint('/api/leaderboard', (): LeaderboardDto => ({ items: [], total: 0 }));
    const w = await mountSuspended(RatingAiDotplot);
    expect(w.text()).toContain('AI-агенты появятся после запуска эксперимента');
  });

  it('draws a row per type with medians, bust dots and profile links', async () => {
    registerEndpoint('/api/rules', () => rules);
    registerEndpoint('/api/leaderboard', (): LeaderboardDto => ({
      items: [
        ai('Рисковый #01', 'Рисковый', 30_000),
        ai('Рисковый #02', 'Рисковый', 50),
        ai('Осторожный #01', 'Осторожный', 9_400),
      ],
      total: 3,
    }));
    const w = await mountSuspended(RatingAiDotplot);
    expect(w.findAll('.row .name').map((n) => n.text())).toEqual(['Рисковый', 'Осторожный']);
    expect(w.findAll('.row .med-v').map((n) => n.text())).toEqual([fmt(15_025), fmt(9_400)]);
    const dots = w.findAll('a.dot');
    expect(dots).toHaveLength(3);
    expect(dots.filter((d) => d.classes().includes('bust'))).toHaveLength(1);
    expect(dots[0]!.attributes('href')).toMatch(/^\/players\//);
  });

  it('includes every AI account across pages when drawing dots and calculating medians', async () => {
    const players = [
      ...Array.from({ length: 100 }, (_, i) => ai(`skeptic-${i}`, 'skeptic', 10_000)),
      ...Array.from({ length: 105 }, (_, i) => ai(`all-in-${i}`, 'all-in', i)),
    ];
    registerEndpoint('/api/rules', () => rules);
    registerEndpoint('/api/leaderboard', (event: { path?: string; url?: URL }): LeaderboardDto => {
      const query = new URL(String(event.path ?? event.url), 'http://test').searchParams;
      const offset = Number(query.get('offset') ?? 0);
      const limit = Number(query.get('limit') ?? 15);
      return { items: players.slice(offset, offset + limit), total: players.length };
    });

    const w = await mountSuspended(RatingAiDotplot);

    expect(w.findAll('a.dot')).toHaveLength(205);
    expect(w.find('.head p').text()).toContain('205 агентов');
    const allIn = w.findAll('.row').find((row) => row.find('.name').text() === 'all-in');
    expect(allIn?.findAll('a.dot')).toHaveLength(105);
    expect(allIn?.find('.med-v').text()).toBe(fmt(52));
  });
});
