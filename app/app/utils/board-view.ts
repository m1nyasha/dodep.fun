import { CELLS, multiplier, type RoundDto } from '@dodep/shared';

export type TileState = 'closed' | 'flip' | 'safe' | 'mine' | 'ghost' | 'dim';

export interface TileView {
  state: TileState;
  hit: boolean;
  label: string;
  delay: number;
}

const view = (state: TileState, extra: Partial<TileView> = {}): TileView => ({
  state,
  hit: false,
  label: '',
  delay: 0,
  ...extra,
});

export const cellsText = (n: number) => `${n} ${plural(n, 'клетка', 'клетки', 'клеток')}`;

export function tileViews(round: RoundDto | null, flipping: number | null): TileView[] {
  const views = Array.from({ length: CELLS }, () => view('closed'));
  if (!round) return views;
  round.opened.forEach((cell, i) => {
    views[cell] = view('safe', { label: fx(multiplier(i + 1, round.rtp)) });
  });
  if (round.status !== 'active') {
    let ghosts = 0;
    for (let i = 0; i < CELLS; i++) {
      if (views[i]!.state === 'safe') continue;
      if (i === round.hitCell) views[i] = view('mine', { hit: true });
      else if (round.mines.includes(i)) views[i] = view('ghost', { delay: 150 + ghosts++ * 90 });
      else views[i] = view('dim');
    }
  }
  if (flipping !== null && views[flipping]?.state === 'closed') views[flipping] = view('flip');
  return views;
}
