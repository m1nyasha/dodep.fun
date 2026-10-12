import { describe, expect, it } from 'vitest';
import { clampBet, maxBetFor } from '../bet';

const limits = { min: 100, step: 100, max: 1_000 };

describe('clampBet', () => {
  it('rounds to the step and keeps the range', () => {
    expect(clampBet(250, limits)).toBe(300);
    expect(clampBet(249, limits)).toBe(200);
    expect(clampBet(0, limits)).toBe(100);
    expect(clampBet(5_000, limits)).toBe(1_000);
  });
});

describe('maxBetFor', () => {
  it('is the balance floored to the step but never below the minimum', () => {
    expect(maxBetFor(10_054, 100, 100)).toBe(10_000);
    expect(maxBetFor(40, 100, 100)).toBe(100);
  });
});
