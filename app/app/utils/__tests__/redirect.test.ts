import { describe, expect, it } from 'vitest';
import { loginRedirectTo, safeRedirect } from '../redirect';

describe('safeRedirect', () => {
  it('accepts a same-site path', () => {
    expect(safeRedirect('/journal')).toBe('/journal');
    expect(safeRedirect('/journal?foo=1#bar')).toBe('/journal?foo=1#bar');
  });

  it('falls back for protocol-relative or absolute URLs', () => {
    expect(safeRedirect('//evil.com')).toBe('/');
    expect(safeRedirect('/\\evil.com')).toBe('/');
    expect(safeRedirect('https://evil.com')).toBe('/');
  });

  it('falls back for a javascript: URI', () => {
    expect(safeRedirect('javascript:alert(1)')).toBe('/');
  });

  it('falls back for missing or non-string input', () => {
    expect(safeRedirect(undefined)).toBe('/');
    expect(safeRedirect(['/journal'])).toBe('/');
    expect(safeRedirect('', '/custom')).toBe('/custom');
  });
});

describe('loginRedirectTo', () => {
  it('builds an auth URL with the path encoded', () => {
    expect(loginRedirectTo('/journal')).toBe('/auth?redirect=%2Fjournal');
  });
});
