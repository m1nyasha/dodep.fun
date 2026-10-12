import { randomMines } from './engine/board.js';

export const MINE_SOURCE = Symbol('MINE_SOURCE');
export type MineSource = () => number[];
export const mineSourceProvider = { provide: MINE_SOURCE, useValue: randomMines satisfies MineSource };
