import { describe, expect, it } from 'vitest';
import { ago, fmt, fmtCompact, fx, pct, plural, signed, stamp } from '../format';

const NBSP = ' ';

describe('fmt / signed', () => {
  it('groups thousands with a no-break space and rounds', () => {
    expect(fmt(10_000)).toBe(`10${NBSP}000`);
    expect(fmt(1_234_567.4)).toBe(`1${NBSP}234${NBSP}567`);
    expect(fmt(Number.NaN)).toBe('0');
  });

  it('prefixes the sign with a true minus', () => {
    expect(signed(154)).toBe('+154');
    expect(signed(-100)).toBe('−100');
    expect(signed(0)).toBe('0');
  });
});

describe('fmtCompact', () => {
  it('keeps full precision below a million', () => {
    expect(fmtCompact(10_000)).toBe(fmt(10_000));
    expect(fmtCompact(999_999)).toBe(fmt(999_999));
  });

  it('shortens millions and billions so huge balances stay short', () => {
    expect(fmtCompact(1_616_805_438)).toBe(`1,6${NBSP}млрд`);
    expect(fmtCompact(1_234_567)).toBe(`1,2${NBSP}млн`);
  });
});

describe('fx', () => {
  it('formats multipliers like the prototype', () => {
    expect(fx(1.21625)).toBe('1,22×');
    expect(fx(150.25)).toBe('150,3×');
    expect(fx(51_695.49)).toBe(`51${NBSP}695×`);
  });
});

describe('pct', () => {
  it('formats a share 0..1', () => {
    expect(pct(0.8)).toBe('80%');
    expect(pct(0.633333)).toBe('63,3%');
    expect(pct(0.0565217)).toBe('5,7%');
    expect(pct(0.0056)).toBe('0,56%');
    expect(pct(0.973)).toBe('97,3%');
  });
});

describe('plural', () => {
  it('picks the Russian form', () => {
    const p = (n: number) => plural(n, 'клетка', 'клетки', 'клеток');
    expect([1, 3, 5, 11, 21, 22, 0].map(p)).toEqual([
      'клетка',
      'клетки',
      'клеток',
      'клеток',
      'клетка',
      'клетки',
      'клеток',
    ]);
  });
});

describe('ago / stamp', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');

  it('describes recent moments', () => {
    expect(ago(new Date(now - 30_000), now)).toBe('только что');
    expect(ago(new Date(now - 5 * 60_000), now)).toBe('5 мин назад');
    expect(ago(new Date(now - 3 * 3_600_000), now)).toBe('3 ч назад');
    expect(ago('2026-10-09T12:00:00Z', now)).toBe('9 окт.');
  });

  it('prints Moscow time', () => {
    expect(stamp('2026-10-12T09:05:00Z')).toBe('12.10, 12:05');
  });
});
