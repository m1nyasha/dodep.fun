import { describe, expect, it } from 'vitest';
import { parseFeedMessage } from '../feed';

const event = {
  type: 'round.finished',
  nickname: 'pixelpanda',
  isAi: false,
  safeCount: 0,
  win: false,
  net: -100,
  at: '2026-10-12T09:00:00.000Z',
};

describe('parseFeedMessage', () => {
  it('extracts finished-round events', () => {
    expect(parseFeedMessage(JSON.stringify({ event: 'round.finished', data: event }))).toEqual(event);
  });

  it('ignores pong, other events and garbage', () => {
    expect(parseFeedMessage('{"event":"pong"}')).toBeNull();
    expect(parseFeedMessage('{"event":"other","data":{}}')).toBeNull();
    expect(parseFeedMessage('not json')).toBeNull();
  });
});
