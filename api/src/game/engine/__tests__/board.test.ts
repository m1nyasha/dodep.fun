import { CELLS, MINES } from '@dodep/shared';
import { describe, expect, it } from 'vitest';
import { layoutHash, newSalt, randomMines } from '../board.js';

describe('randomMines', () => {
  it('returns 5 unique sorted cells in range', () => {
    for (let i = 0; i < 1_000; i++) {
      const mines = randomMines();
      expect(mines).toHaveLength(MINES);
      expect(new Set(mines).size).toBe(MINES);
      expect(mines.every((m) => Number.isInteger(m) && m >= 0 && m < CELLS)).toBe(true);
      expect([...mines].sort((a, b) => a - b)).toEqual(mines);
    }
  });

  it('places mines uniformly', () => {
    const runs = 50_000;
    const hits = new Array<number>(CELLS).fill(0);
    for (let i = 0; i < runs; i++) for (const m of randomMines()) hits[m] = (hits[m] || 0) + 1;
    const expected = (runs * MINES) / CELLS;
    for (const h of hits) expect(Math.abs(h - expected) / expected).toBeLessThan(0.05);
  });
});

describe('layoutHash', () => {
  it('hashes the canonical layout string', () => {
    expect(layoutHash([4, 3, 2, 1, 0], 'abc')).toBe('56637356d45c739eb942dbdedcf79685156e2dd36f83a4f177ddd29183fec675');
  });
});

describe('newSalt', () => {
  it('is 32 hex chars and differs between calls', () => {
    const a = newSalt();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(newSalt()).not.toBe(a);
  });
});
