import { describe, expect, it } from 'vitest';
import { SAFE } from '../board.js';
import { multiplier, nextSafeChance, payout, safeChance } from '../payout.js';

const RTP = 0.973;

describe('safeChance', () => {
  it('matches the rules table', () => {
    expect(safeChance(0)).toBe(1);
    expect(safeChance(1)).toBeCloseTo(0.8, 10);
    expect(safeChance(2)).toBeCloseTo(0.633333, 6);
    expect(safeChance(5)).toBeCloseTo(0.2918125, 6);
    expect(safeChance(10)).toBeCloseTo(0.0565217, 6);
  });

  it('rejects depth outside 0..20 or fractional', () => {
    expect(() => safeChance(-1)).toThrow(RangeError);
    expect(() => safeChance(SAFE + 1)).toThrow(RangeError);
    expect(() => safeChance(1.5)).toThrow(RangeError);
  });
});

describe('nextSafeChance', () => {
  it('drops as cells open', () => {
    expect(nextSafeChance(0)).toBe(0.8);
    expect(nextSafeChance(5)).toBe(0.75);
    expect(nextSafeChance(19)).toBeCloseTo(1 / 6, 10);
  });
});

describe('multiplier', () => {
  it('is 1 before the first cell', () => {
    expect(multiplier(0, RTP)).toBe(1);
  });

  it('matches the CASINO column of the rules', () => {
    expect(multiplier(1, RTP)).toBe(1.21625);
    expect(multiplier(3, RTP)).toBe(1.96307);
    expect(multiplier(10, RTP)).toBe(17.214615);
  });

  it('keeps RTP for every exit depth', () => {
    for (let k = 1; k <= SAFE; k++) {
      expect(safeChance(k) * multiplier(k, RTP)).toBeCloseTo(RTP, 5);
    }
  });

  it('grows strictly with depth', () => {
    for (let k = 1; k <= SAFE; k++) {
      expect(multiplier(k, RTP)).toBeGreaterThan(multiplier(k - 1, RTP));
    }
  });

  it('has at most 6 decimals', () => {
    for (let k = 1; k <= SAFE; k++) {
      const m = multiplier(k, RTP);
      expect(Math.round(m * 1e6) / 1e6).toBe(m);
    }
  });
});

describe('payout', () => {
  it('rounds once from the precise multiplier', () => {
    expect(payout(100, 1, RTP)).toBe(122);
    expect(payout(500, 3, RTP)).toBe(982);
    expect(payout(100, 0, RTP)).toBe(100);
  });
});
