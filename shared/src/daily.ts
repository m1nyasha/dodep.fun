export const DAILY_HOUR_MSK = 12;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MSK_OFFSET = 3 * HOUR;

const mskDayIndex = (date: Date) => Math.floor((date.getTime() + MSK_OFFSET) / DAY);

export function mskDayKey(date: Date): string {
  return new Date(mskDayIndex(date) * DAY).toISOString().slice(0, 10);
}

export function nextDailyAt(lastClaimAt: Date | null): Date {
  if (!lastClaimAt) return new Date(0);
  return new Date((mskDayIndex(lastClaimAt) + 1) * DAY + DAILY_HOUR_MSK * HOUR - MSK_OFFSET);
}

export function isDailyAvailable(input: { balance: number; target: number; lastClaimAt: Date | null; now: Date }) {
  return input.balance < input.target && input.now.getTime() >= nextDailyAt(input.lastClaimAt).getTime();
}
