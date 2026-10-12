import type { ActiveRoundDto, FinishedRoundDto } from '@dodep/shared';
import { describe, expect, it } from 'vitest';
import { cellsText, tileViews } from '../board-view';

const active: ActiveRoundDto = {
  id: 'r1',
  roundNo: 1,
  bet: 100,
  hash: 'h',
  ruleVersion: 1,
  rtp: 0.973,
  opened: [10, 11],
  safeCount: 2,
  startedAt: '2026-10-12T09:00:00.000Z',
  status: 'active',
  multiplier: 1.536316,
  potentialPayout: 154,
};

const lost: FinishedRoundDto = {
  ...active,
  status: 'hit_mine',
  endReason: 'mine',
  multiplier: 0,
  payout: 0,
  net: -100,
  hitCell: 3,
  mines: [0, 1, 2, 3, 4],
  salt: 's',
  finishedAt: '2026-10-12T09:01:00.000Z',
};

describe('tileViews', () => {
  it('is all closed without a round', () => {
    expect(tileViews(null, null).every((v) => v.state === 'closed')).toBe(true);
  });

  it('labels opened cells with their own multiplier and flips the pending one', () => {
    const views = tileViews(active, 12);
    expect(views[10]).toMatchObject({ state: 'safe', label: '1,22×' });
    expect(views[11]).toMatchObject({ state: 'safe', label: '1,54×' });
    expect(views[12]!.state).toBe('flip');
    expect(views[0]!.state).toBe('closed');
  });

  it('reveals a finished board: hit mine, ghost mines with staggered delay, dim rest', () => {
    const views = tileViews(lost, null);
    expect(views[3]).toMatchObject({ state: 'mine', hit: true });
    expect(views.filter((v) => v.state === 'ghost').map((v) => v.delay)).toEqual([150, 240, 330, 420]);
    expect(views.filter((v) => v.state === 'dim')).toHaveLength(18);
    expect(views[10]!.state).toBe('safe');
  });
});

describe('cellsText', () => {
  it('pluralizes', () => {
    expect([1, 2, 5].map(cellsText)).toEqual(['1 клетка', '2 клетки', '5 клеток']);
  });
});
