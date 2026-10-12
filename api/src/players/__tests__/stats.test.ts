import { describe, expect, it } from 'vitest';
import { summarize } from '../stats.js';

const row = (balance: number, totalWagered = 0, totalPayout = 0, roundsCount = 0) => ({
  balance,
  totalWagered,
  totalPayout,
  roundsCount,
});

describe('summarize', () => {
  it('computes totals, RTP, profitable share and median', () => {
    const s = summarize([row(9_000, 1_000, 0, 2), row(12_000, 1_000, 3_000, 3), row(10_000, 0, 0, 0)], 'human');
    expect(s).toMatchObject({
      scope: 'human',
      accounts: 3,
      rounds: 5,
      wagered: 2_000,
      payout: 3_000,
      rtp: 1.5,
      profitableShare: 1 / 3,
      medianBalance: 10_000,
    });
  });

  it('uses the mean of the two middle balances for even counts', () => {
    expect(summarize([row(1_000), row(3_000)], 'ai').medianBalance).toBe(2_000);
  });

  it('buckets balances with an open last bucket', () => {
    const s = summarize([row(0), row(2_499), row(10_000), row(50_000)], 'human');
    expect(s.histogram[0]).toEqual({ from: 0, to: 2_500, count: 2 });
    expect(s.histogram[4]).toEqual({ from: 10_000, to: 12_500, count: 1 });
    expect(s.histogram.at(-1)).toEqual({ from: 30_000, to: null, count: 1 });
    expect(s.histogram).toHaveLength(9);
  });

  it('returns nulls for an empty population', () => {
    expect(summarize([], 'ai')).toMatchObject({ accounts: 0, rtp: null, profitableShare: null, medianBalance: null });
  });
});
