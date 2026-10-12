import { describe, expect, it } from 'vitest';
import { normalizeStatus } from '../status.js';

describe('normalizeStatus', () => {
  it('strips links and collapses whitespace', () => {
    expect(normalizeStatus('  Выход   — тоже ход https://x.io/a www.spam.ru  ')).toBe('Выход — тоже ход');
  });

  it('caps the length at 72', () => {
    expect(normalizeStatus('a'.repeat(100))).toHaveLength(72);
  });

  it('returns empty for blank input', () => {
    expect(normalizeStatus('   ')).toBe('');
  });
});
