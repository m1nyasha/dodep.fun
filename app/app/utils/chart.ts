import type { PlayerDto } from '@dodep/shared';

export function cumulativeNet(rounds: readonly { roundNo: number; net: number }[]): number[] {
  const points = [0];
  for (const r of [...rounds].sort((a, b) => a.roundNo - b.roundNo)) points.push(points.at(-1)! + r.net);
  return points;
}

export function sparkGeometry(points: readonly number[], width: number, height: number, pad = 10) {
  const min = Math.min(0, ...points);
  const span = Math.max(0, ...points) - min || 1;
  const x = (i: number) => (points.length > 1 ? (i / (points.length - 1)) * width : 0);
  const y = (v: number) => pad + (height - 2 * pad) * (1 - (v - min) / span);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return { d, zeroY: y(0), x, y };
}

export function kLabel(n: number): string {
  return n ? `${String(n / 1000).replace('.', ',')}к` : '0';
}

export function groupByType(players: readonly PlayerDto[]) {
  const groups = new Map<string, PlayerDto[]>();
  for (const p of players) {
    const type = p.aiType ?? 'Без типажа';
    groups.set(type, [...(groups.get(type) ?? []), p]);
  }
  return [...groups]
    .map(([type, list]) => {
      const sorted = [...list].sort((a, b) => a.balance - b.balance);
      const mid = sorted.length >> 1;
      const median = sorted.length % 2 ? sorted[mid]!.balance : (sorted[mid - 1]!.balance + sorted[mid]!.balance) / 2;
      return { type, players: sorted, median };
    })
    .sort((a, b) => b.median - a.median);
}

export function axisMax(players: readonly { balance: number }[]): number {
  return Math.max(30_000, Math.ceil(Math.max(0, ...players.map((p) => p.balance)) / 10_000) * 10_000);
}

export function jitter(name: string, spread = 7): number {
  let h = 2166136261;
  for (const ch of name) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return ((h >>> 0) % (spread * 2 + 1)) - spread;
}
