import type { FinishedRoundDto } from '@dodep/shared';

export const minesLabel = (mines: readonly number[]) => mines.map((m) => m + 1).join(', ');

export function journalJson(nickname: string, rounds: readonly FinishedRoundDto[], exportedAt = new Date()): string {
  return JSON.stringify({ player: nickname, exportedAt: exportedAt.toISOString(), rounds }, null, 2);
}
