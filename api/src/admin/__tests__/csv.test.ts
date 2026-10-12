import { describe, expect, it } from 'vitest';
import { toCsv } from '../csv.js';

describe('toCsv', () => {
  it('writes a header and rows with CRLF', () => {
    expect(
      toCsv([
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ]),
    ).toBe('a,b\r\n1,x\r\n2,y\r\n');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([{ v: 'a,b' }, { v: 'say "hi"' }, { v: 'two\nlines' }])).toBe(
      'v\r\n"a,b"\r\n"say ""hi"""\r\n"two\nlines"\r\n',
    );
  });

  it('formats dates, booleans and empties', () => {
    expect(toCsv([{ at: new Date('2026-10-12T09:00:00Z'), ok: true, none: null, missing: undefined }])).toBe(
      'at,ok,none,missing\r\n2026-10-12T09:00:00.000Z,true,,\r\n',
    );
  });

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});
