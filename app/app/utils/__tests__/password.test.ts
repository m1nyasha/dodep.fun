import { describe, expect, it } from 'vitest';
import { passwordStrength } from '../password';

describe('passwordStrength', () => {
  it('scores like the prototype meter', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('abcdefgh')).toBe(1);
    expect(passwordStrength('abcdefghijkl')).toBe(2);
    expect(passwordStrength('Abcdefghijkl')).toBe(3);
    expect(passwordStrength('Abcdefghijk1!')).toBe(4);
  });
});
