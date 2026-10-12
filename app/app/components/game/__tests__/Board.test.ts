import type { ActiveRoundDto, FinishedRoundDto } from '@dodep/shared';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import GameBoard from '../Board.vue';

const active: ActiveRoundDto = {
  id: 'r1',
  roundNo: 1,
  bet: 100,
  hash: 'h',
  ruleVersion: 1,
  rtp: 0.973,
  opened: [10],
  safeCount: 1,
  startedAt: '2026-10-12T09:00:00.000Z',
  status: 'active',
  multiplier: 1.21625,
  potentialPayout: 122,
};

describe('GameBoard', () => {
  it('renders 25 cells and emits the clicked one', async () => {
    const w = await mountSuspended(GameBoard, { props: { round: active, flipping: null, nextLabel: '1,54×' } });
    const tiles = w.findAll('button[data-cell]');
    expect(tiles).toHaveLength(25);
    expect(tiles[10]!.classes()).toEqual(expect.arrayContaining(['open', 'safe']));
    expect(tiles[10]!.text()).toBe('1,22×');
    expect(tiles[10]!.attributes('aria-label')).toBe('Клетка 11, безопасно');
    await tiles[3]!.trigger('click');
    expect(w.emitted('open')?.[0]?.[0]).toBe(3);
  });

  it('marks the hit mine on a finished round', async () => {
    const lost: FinishedRoundDto = {
      ...active,
      status: 'hit_mine',
      endReason: 'mine',
      multiplier: 0,
      payout: 0,
      net: -100,
      hitCell: 4,
      mines: [0, 1, 2, 3, 4],
      salt: 's',
      finishedAt: '2026-10-12T09:01:00.000Z',
    };
    const w = await mountSuspended(GameBoard, { props: { round: lost, flipping: null, nextLabel: '' } });
    const tiles = w.findAll('button[data-cell]');
    expect(tiles[4]!.classes()).toEqual(expect.arrayContaining(['mine', 'hit']));
    expect(tiles[4]!.attributes('aria-label')).toBe('Клетка 5, мина');
    expect(w.findAll('.ghost')).toHaveLength(4);
  });
});
