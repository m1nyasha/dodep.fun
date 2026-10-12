import type { StatsDto, StatsScope } from '@dodep/shared';

export const HISTOGRAM_EDGES = [0, 2_500, 5_000, 7_500, 10_000, 12_500, 15_000, 20_000, 30_000];

interface Row {
  balance: number;
  totalWagered: number;
  totalPayout: number;
  roundsCount: number;
}

const sum = (rows: Row[], pick: (r: Row) => number) => rows.reduce((s, r) => s + pick(r), 0);

function median(sorted: number[]): number | null {
  if (!sorted.length) return null;
  const mid = sorted.length >> 1;
  const hi = sorted[mid] ?? 0;
  if (sorted.length % 2) return hi;
  const lo = sorted[mid - 1] ?? 0;
  return (lo + hi) / 2;
}

export function summarize(rows: Row[], scope: StatsScope): StatsDto {
  const wagered = sum(rows, (r) => r.totalWagered);
  const payout = sum(rows, (r) => r.totalPayout);
  const balances = rows.map((r) => r.balance).sort((a, b) => a - b);

  return {
    scope,
    accounts: rows.length,
    rounds: sum(rows, (r) => r.roundsCount),
    wagered,
    payout,
    rtp: wagered ? payout / wagered : null,
    profitableShare: rows.length ? rows.filter((r) => r.totalPayout > r.totalWagered).length / rows.length : null,
    medianBalance: median(balances),
    histogram: HISTOGRAM_EDGES.map((from, i) => {
      const to = HISTOGRAM_EDGES[i + 1] ?? null;
      return { from, to, count: balances.filter((b) => b >= from && (to === null || b < to)).length };
    }),
  };
}
