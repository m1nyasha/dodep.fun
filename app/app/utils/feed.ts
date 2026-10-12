import type { FeedEventDto } from '@dodep/shared';

export const FEED_SIZE = 6;
export const FEED_PING = JSON.stringify({ event: 'ping' });
export const FEED_PONG = JSON.stringify({ event: 'pong' });

export function parseFeedMessage(raw: string): FeedEventDto | null {
  try {
    const msg = JSON.parse(raw) as { event?: string; data?: FeedEventDto };
    return msg.event === 'round.finished' && msg.data ? msg.data : null;
  } catch {
    return null;
  }
}
