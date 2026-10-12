export const playerPath = (nickname: string) => `/players/${encodeURIComponent(nickname)}`;

export function playerKind(p: { isAi: boolean; nickname: string }, me?: string | null): 'ai' | 'me' | 'human' {
  if (p.isAi) return 'ai';
  return me && me.toLowerCase() === p.nickname.toLowerCase() ? 'me' : 'human';
}

export const gapToFifth = (balance: number, fifth: number | null) => (fifth === null ? 0 : Math.max(0, fifth - balance + 1));
