import { CELLS, SAFE } from './board.js';

function assertDepth(k: number): void {
  if (!Number.isInteger(k) || k < 0 || k > SAFE) throw new RangeError(`Depth must be an integer 0..${SAFE}, got ${k}`);
}

export function safeChance(k: number): number {
  assertDepth(k);
  let p = 1;
  for (let i = 0; i < k; i++) p *= (SAFE - i) / (CELLS - i);
  return p;
}

export function nextSafeChance(opened: number): number {
  assertDepth(opened);
  return (SAFE - opened) / (CELLS - opened);
}

export function multiplier(k: number, rtp: number): number {
  if (k === 0) return 1;
  return Math.round((rtp / safeChance(k)) * 1e6) / 1e6;
}

export function payout(bet: number, k: number, rtp: number): number {
  return Math.round(bet * multiplier(k, rtp));
}
