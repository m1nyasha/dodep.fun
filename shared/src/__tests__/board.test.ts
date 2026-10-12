import { describe, expect, it } from 'vitest';
import { layoutString } from '../board.js';

describe('layoutString', () => {
  it('sorts mines ascending and appends the salt', () => {
    expect(layoutString([4, 0, 3, 1, 2], 'abc')).toBe('0,1,2,3,4:abc');
  });

  it('does not mutate the input', () => {
    const mines = [9, 2];
    layoutString(mines, 's');
    expect(mines).toEqual([9, 2]);
  });
});
