export const CELLS = 25;
export const MINES = 5;
export const SAFE = CELLS - MINES;

export function layoutString(mines: readonly number[], salt: string): string {
  return `${[...mines].sort((a, b) => a - b).join(',')}:${salt}`;
}
