// @vitest-environment nuxt
import { multiplier, payout, safeChance, type RulesDto } from '@dodep/shared';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { fmt, fx, pct } from '#imports';
import RulesCalculator from '../RulesCalculator.vue';

const rules: RulesDto = {
  version: 1,
  rtp: 0.973,
  minBet: 100,
  betStep: 100,
  startBalance: 10_000,
  dailyTarget: 10_000,
  cells: 25,
  mines: 5,
  ladder: [],
};

describe('RulesCalculator', () => {
  it('shows chance, multiplier and payout for the chosen depth', async () => {
    const w = await mountSuspended(RulesCalculator, { props: { rules, k: 3 } });
    expect(w.text()).toContain(pct(safeChance(3)));
    expect(w.text()).toContain(fx(multiplier(3, 0.973)));
    expect(w.text()).toContain(fmt(payout(100, 3, 0.973)));
    expect(w.text()).toContain('× 0,973 ÷');
    expect(w.findAll('.board i.s')).toHaveLength(3);
  });

  it('recalculates the payout for a typed bet and ignores non-digits', async () => {
    const w = await mountSuspended(RulesCalculator, { props: { rules, k: 3 } });
    const input = w.get('input[inputmode="numeric"]');
    (input.element as HTMLInputElement).value = '5x00';
    await input.trigger('input');
    expect((input.element as HTMLInputElement).value).toBe('500');
    expect(w.text()).toContain(fmt(payout(500, 3, 0.973)));
  });

  it('clamps a huge bet to 1 000 000 000', async () => {
    const w = await mountSuspended(RulesCalculator, { props: { rules, k: 3 } });
    const input = w.get('input[inputmode="numeric"]');
    (input.element as HTMLInputElement).value = '1001111111111111111111';
    await input.trigger('input');
    expect((input.element as HTMLInputElement).value).toBe('1000000000');
    expect(w.text()).toContain(fmt(payout(1_000_000_000, 3, 0.973)));
  });

  it('emits the new depth from the slider', async () => {
    const w = await mountSuspended(RulesCalculator, { props: { rules, k: 3 } });
    await w.get('input[type="range"]').setValue('7');
    expect(w.emitted('update:k')).toEqual([[7]]);
  });
});
