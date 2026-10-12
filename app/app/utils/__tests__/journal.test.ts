import type { FinishedRoundDto } from '@dodep/shared';
import { describe, expect, it } from 'vitest';
import { journalJson, minesLabel } from '../journal';

const round: FinishedRoundDto = {
  id: '0192f0a0-0000-7000-8000-000000000001',
  roundNo: 1,
  bet: 100,
  hash: 'h',
  ruleVersion: 1,
  rtp: 0.973,
  opened: [10],
  safeCount: 1,
  startedAt: '2026-10-12T10:00:00.000Z',
  status: 'hit_mine',
  endReason: 'mine',
  multiplier: 0,
  payout: 0,
  net: -100,
  hitCell: 3,
  mines: [0, 1, 2, 3, 4],
  salt: 's',
  finishedAt: '2026-10-12T10:00:05.000Z',
};

describe('minesLabel', () => {
  it('numbers cells from one', () => {
    expect(minesLabel([0, 4, 24])).toBe('1, 5, 25');
  });
});

describe('journalJson', () => {
  it('wraps rounds with the player and export time', () => {
    const json = JSON.parse(journalJson('felix', [round], new Date('2026-10-12T12:00:00.000Z')));
    expect(json).toEqual({ player: 'felix', exportedAt: '2026-10-12T12:00:00.000Z', rounds: [round] });
  });
});
