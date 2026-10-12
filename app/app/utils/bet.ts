export function clampBet(value: number, limits: { min: number; step: number; max: number }): number {
  return Math.min(limits.max, Math.max(limits.min, Math.round(value / limits.step) * limits.step));
}

export function maxBetFor(balance: number, min: number, step: number): number {
  return Math.max(min, Math.floor(balance / step) * step);
}
