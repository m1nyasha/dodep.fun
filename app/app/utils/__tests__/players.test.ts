import { describe, expect, it } from 'vitest';
import { gapToFifth, playerKind, playerPath } from '../players';

describe('playerPath', () => {
  it('encodes the nickname', () => {
    expect(playerPath('Осторожный #01')).toBe(
      '/players/%D0%9E%D1%81%D1%82%D0%BE%D1%80%D0%BE%D0%B6%D0%BD%D1%8B%D0%B9%20%2301',
    );
  });
});

describe('playerKind', () => {
  it('marks AI, me (case-insensitive) and humans', () => {
    expect(playerKind({ isAi: true, nickname: 'bot' }, 'bot')).toBe('ai');
    expect(playerKind({ isAi: false, nickname: 'Mono' }, 'mono')).toBe('me');
    expect(playerKind({ isAi: false, nickname: 'felix' }, 'mono')).toBe('human');
    expect(playerKind({ isAi: false, nickname: 'felix' })).toBe('human');
  });
});

describe('gapToFifth', () => {
  it('needs one coin more than the fifth human', () => {
    expect(gapToFifth(10_000, 15_200)).toBe(5_201);
    expect(gapToFifth(20_000, 15_200)).toBe(0);
    expect(gapToFifth(10_000, null)).toBe(0);
  });
});
