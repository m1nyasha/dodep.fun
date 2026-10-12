import { createHash, randomBytes, randomInt } from 'node:crypto';
import { CELLS, layoutString, MINES } from '@dodep/shared';

export function randomMines(): number[] {
  const cells = [...Array(CELLS)].map((_, i) => i);

  for (let i = 0; i < MINES; i++) {
    const j = randomInt(i, CELLS);
    const cellI = cells[i];
    const cellJ = cells[j];
    if (cellI !== undefined && cellJ !== undefined) {
      cells[i] = cellJ;
      cells[j] = cellI;
    }
  }
  return cells.slice(0, MINES).sort((a, b) => a - b);
}

export const newSalt = () => randomBytes(16).toString('hex');

export const layoutHash = (mines: readonly number[], salt: string) =>
  createHash('sha256').update(layoutString(mines, salt)).digest('hex');
