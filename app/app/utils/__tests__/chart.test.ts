import type { PlayerDto } from '@dodep/shared';
import { describe, expect, it } from 'vitest';
import { axisMax, cumulativeNet, groupByType, jitter, kLabel, sparkGeometry } from '../chart';

const player = (nickname: string, balance: number, aiType: string | null = 'Осторожный'): PlayerDto => ({
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

describe('cumulativeNet', () => {
  it('starts at zero and accumulates by round number', () => {
    expect(
      cumulativeNet([
        { roundNo: 3, net: -100 },
        { roundNo: 1, net: 50 },
        { roundNo: 2, net: 20 },
      ]),
    ).toEqual([0, 50, 70, -30]);
  });

  it('is a single zero for no rounds', () => {
    expect(cumulativeNet([])).toEqual([0]);
  });
});

describe('sparkGeometry', () => {
  it('maps the range to the padded box and keeps zero inside', () => {
    const g = sparkGeometry([0, 100, -100], 800, 180, 10);
    expect(g.x(0)).toBe(0);
    expect(g.x(2)).toBe(800);
    expect(g.y(100)).toBe(10);
    expect(g.y(-100)).toBe(170);
    expect(g.zeroY).toBe(90);
    expect(g.d).toBe('M0.0,90.0L400.0,10.0L800.0,170.0');
  });

  it('does not divide by zero for a flat line', () => {
    const g = sparkGeometry([0, 0], 800, 180, 10);
    expect(Number.isFinite(g.y(0))).toBe(true);
  });
});

describe('kLabel', () => {
  it('formats thousands the Russian way', () => {
    expect([0, 2_500, 5_000, 10_000, 12_500, 30_000].map(kLabel)).toEqual(['0', '2,5к', '5к', '10к', '12,5к', '30к']);
  });
});

describe('groupByType', () => {
  it('groups, sorts by balance and orders groups by median desc', () => {
    const rows = groupByType([
      player('a1', 9_000),
      player('r1', 30_000, 'Рисковый'),
      player('a2', 9_400),
      player('r2', 0, 'Рисковый'),
      player('x', 5_000, null),
    ]);
    expect(rows.map((r) => [r.type, r.median])).toEqual([
      ['Рисковый', 15_000],
      ['Осторожный', 9_200],
      ['Без типажа', 5_000],
    ]);
    expect(rows[0]!.players.map((p) => p.nickname)).toEqual(['r2', 'r1']);
  });
});

describe('axisMax', () => {
  it('is at least 30k and rounds up to 10k', () => {
    expect(axisMax([])).toBe(30_000);
    expect(axisMax([{ balance: 12_000 }])).toBe(30_000);
    expect(axisMax([{ balance: 41_000 }])).toBe(50_000);
  });
});

describe('jitter', () => {
  it('is deterministic and within the spread', () => {
    expect(jitter('Осторожный #01')).toBe(jitter('Осторожный #01'));
    for (const n of ['a', 'b', 'c', 'Рисковый #10']) expect(Math.abs(jitter(n, 7))).toBeLessThanOrEqual(7);
  });
});
