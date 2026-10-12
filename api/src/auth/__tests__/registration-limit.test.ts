import { describe, expect, it } from 'vitest';
import { parseRegistrationLimit } from '../registration-limit.js';

describe('parseRegistrationLimit', () => {
  it('reads a stored value', () => {
    expect(parseRegistrationLimit({ count: 3, windowHours: 12 })).toEqual({ count: 3, windowHours: 12 });
  });

  it('falls back to 5 per 24h on garbage', () => {
    expect(parseRegistrationLimit(null)).toEqual({ count: 5, windowHours: 24 });
    expect(parseRegistrationLimit({ count: -1, windowHours: 'x' })).toEqual({ count: 5, windowHours: 24 });
  });
});
