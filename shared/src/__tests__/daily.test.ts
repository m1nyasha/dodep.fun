import { describe, expect, it } from 'vitest';
import { isDailyAvailable, mskDayKey, nextDailyAt } from '../daily.js';

const utc = (iso: string) => new Date(iso);

describe('nextDailyAt', () => {
  it('is the epoch when nothing was claimed', () => {
    expect(nextDailyAt(null).getTime()).toBe(0);
  });

  it('is 12:00 MSK of the next MSK day after a morning claim', () => {
    expect(nextDailyAt(utc('2026-10-12T07:00:00Z')).toISOString()).toBe('2026-10-13T09:00:00.000Z');
  });

  it('is 12:00 MSK of the next MSK day after an afternoon claim', () => {
    expect(nextDailyAt(utc('2026-10-12T12:30:00Z')).toISOString()).toBe('2026-10-13T09:00:00.000Z');
  });

  it('uses the MSK calendar day, not the UTC one', () => {
    expect(nextDailyAt(utc('2026-10-12T22:30:00Z')).toISOString()).toBe('2026-10-14T09:00:00.000Z');
  });
});

describe('isDailyAvailable', () => {
  const lastClaimAt = utc('2026-10-12T07:00:00Z');

  it('is closed before 12:00 MSK of the next day', () => {
    expect(isDailyAvailable({ balance: 0, target: 10_000, lastClaimAt, now: utc('2026-10-13T08:59:59.999Z') })).toBe(
      false,
    );
  });

  it('opens exactly at 12:00 MSK of the next day', () => {
    expect(isDailyAvailable({ balance: 0, target: 10_000, lastClaimAt, now: utc('2026-10-13T09:00:00Z') })).toBe(true);
  });

  it('is closed when the balance is not below the target', () => {
    const now = utc('2026-10-20T10:00:00Z');
    expect(isDailyAvailable({ balance: 10_000, target: 10_000, lastClaimAt, now })).toBe(false);
    expect(isDailyAvailable({ balance: 9_999, target: 10_000, lastClaimAt, now })).toBe(true);
  });

  it('is open with no previous claim', () => {
    expect(isDailyAvailable({ balance: 0, target: 10_000, lastClaimAt: null, now: utc('2026-10-12T00:00:00Z') })).toBe(
      true,
    );
  });
});

describe('mskDayKey', () => {
  it('shifts to MSK before taking the date', () => {
    expect(mskDayKey(utc('2026-10-12T20:59:59Z'))).toBe('2026-10-12');
    expect(mskDayKey(utc('2026-10-12T21:00:00Z'))).toBe('2026-10-13');
  });
});
