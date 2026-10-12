// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import RatingBalanceHistogram from '../RatingBalanceHistogram.vue';

const buckets = [
  { from: 0, to: 2_500, count: 2 },
  { from: 2_500, to: 10_000, count: 0 },
  { from: 10_000, to: 30_000, count: 4 },
  { from: 30_000, to: null, count: 1 },
];

describe('RatingBalanceHistogram', () => {
  it('labels buckets, scales bars to the max and marks the start balance', async () => {
    const w = await mountSuspended(RatingBalanceHistogram, { props: { buckets, mark: 10_000, total: 7 } });
    expect(w.findAll('.labels span').map((s) => s.text())).toEqual(['0', '2,5к', '10к', '30к+']);
    const bars = w.findAll('.bar');
    expect(bars[2]!.attributes('style')).toContain('--h: 100%');
    expect(bars[0]!.attributes('style')).toContain('--h: 50%');
    expect(bars[2]!.classes()).toContain('mark');
    expect(bars[3]!.attributes('aria-label')).toBe('30к+: 1');
    expect(w.text()).toContain('n = 7');
  });
});
