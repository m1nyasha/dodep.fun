// @vitest-environment nuxt
import type { PlayerDto } from '@dodep/shared';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import RatingPodium from '../RatingPodium.vue';

const leaders: PlayerDto[] = [
  { nickname: 'robot', rank: 1, humanRank: null, isAi: true, aiType: 'Рисковый', balance: 30_000 },
  { nickname: 'human', rank: 2, humanRank: 1, isAi: false, aiType: null, balance: 20_000 },
  { nickname: 'robot2', rank: 3, humanRank: null, isAi: true, aiType: 'Осторожный', balance: 15_000 },
].map((player) => ({
  ...player,
  isTop: !player.isAi,
  net: 0,
  roundsCount: 3,
  status: null,
  createdAt: '2026-10-12T00:00:00.000Z',
}));

describe('RatingPodium', () => {
  it('shows global places for a mixed podium of AI and human players', async () => {
    const w = await mountSuspended(RatingPodium, { props: { players: leaders, me: null } });
    const cards = w.findAll('.pod');
    expect(cards.map((card) => card.find('.place').text())).toEqual(['1', '2', '3']);
    expect(cards.map((card) => card.classes())).toEqual([
      expect.arrayContaining(['p1']),
      expect.arrayContaining(['p2']),
      expect.arrayContaining(['p3']),
    ]);
    expect(cards[0]!.attributes('href')).toBe('/players/robot');
  });
});
