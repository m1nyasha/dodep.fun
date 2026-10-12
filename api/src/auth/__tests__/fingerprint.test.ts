import { describe, expect, it } from 'vitest';
import { normalizeIp } from '../fingerprint.js';

describe('normalizeIp', () => {
  it('unwraps IPv4-mapped IPv6', () => {
    expect(normalizeIp('::ffff:10.0.0.7')).toBe('10.0.0.7');
  });

  it('keeps plain IPv4 and IPv6', () => {
    expect(normalizeIp('10.0.0.7')).toBe('10.0.0.7');
    expect(normalizeIp('2001:db8::1')).toBe('2001:db8::1');
  });

  it('falls back for missing ip', () => {
    expect(normalizeIp(undefined)).toBe('0.0.0.0');
  });
});
