import { describe, expect, it } from 'vitest';
import { ruleInputErrors } from '../rules-input.js';

const valid = { rtp: 0.973, minBet: 100, betStep: 100, startBalance: 10_000, dailyTarget: 10_000 };

describe('ruleInputErrors', () => {
  it('accepts the default rules', () => {
    expect(ruleInputErrors(valid)).toEqual({});
  });

  it('bounds RTP to 0.5..1 with at most 6 decimals', () => {
    expect(ruleInputErrors({ ...valid, rtp: 0.4 })).toHaveProperty('rtp');
    expect(ruleInputErrors({ ...valid, rtp: 1.01 })).toHaveProperty('rtp');
    expect(ruleInputErrors({ ...valid, rtp: 0.9731234 })).toHaveProperty('rtp');
    expect(ruleInputErrors({ ...valid, rtp: 1 })).toEqual({});
  });

  it('requires positive integers for money', () => {
    expect(ruleInputErrors({ ...valid, minBet: 0 })).toHaveProperty('minBet');
    expect(ruleInputErrors({ ...valid, betStep: 1.5 })).toHaveProperty('betStep');
    expect(ruleInputErrors({ ...valid, startBalance: -1 })).toHaveProperty('startBalance');
    expect(ruleInputErrors({ ...valid, dailyTarget: 0 })).toEqual({});
    expect(ruleInputErrors({ ...valid, dailyTarget: -100 })).toHaveProperty('dailyTarget');
  });

  it('requires the minimum bet to be a multiple of the step', () => {
    expect(ruleInputErrors({ ...valid, minBet: 150 })).toEqual({
      minBet: 'Минимальная ставка должна быть кратна шагу',
    });
  });

  it('requires the start balance to cover the minimum bet', () => {
    expect(ruleInputErrors({ ...valid, startBalance: 50, minBet: 100 })).toHaveProperty('startBalance');
  });
});
