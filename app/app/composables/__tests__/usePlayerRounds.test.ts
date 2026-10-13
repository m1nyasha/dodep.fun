// @vitest-environment nuxt
import type { FinishedRoundDto, RoundsPageDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { usePlayerRounds } from '../usePlayerRounds';

const round = (roundNo: number) => ({ id: `r${roundNo}`, roundNo }) as FinishedRoundDto;

const queryOf = (event: { path?: string; url?: URL }) =>
  new URL(String(event.path ?? event.url), 'http://test').searchParams;

describe('usePlayerRounds', () => {
  it('follows the cursor and resets on reload for the given nickname', async () => {
    const cursors: (string | null)[] = [];
    registerEndpoint('/api/players/watched/rounds', (event: { path?: string; url?: URL }): RoundsPageDto => {
      cursors.push(queryOf(event).get('cursor'));
      const cursor = queryOf(event).get('cursor');
      return cursor ? { items: [round(1)], nextCursor: null } : { items: [round(3), round(2)], nextCursor: 2 };
    });
    const rounds = usePlayerRounds(ref('watched'), 2);
    await rounds.load(true);
    expect(rounds.nextCursor.value).toBe(2);
    await rounds.loadMore();
    expect(rounds.items.value.map((r) => r.roundNo)).toEqual([3, 2, 1]);
    expect(rounds.nextCursor.value).toBeNull();
    await rounds.load(true);
    expect(rounds.items.value.map((r) => r.roundNo)).toEqual([3, 2]);
    expect(cursors).toEqual([null, '2', null]);
  });

  it('reloads fresh when the nickname changes', async () => {
    registerEndpoint('/api/players/alpha/rounds', (): RoundsPageDto => ({ items: [round(5)], nextCursor: null }));
    registerEndpoint('/api/players/beta/rounds', (): RoundsPageDto => ({ items: [round(9)], nextCursor: null }));
    const nickname = ref('alpha');
    const rounds = usePlayerRounds(nickname);
    await rounds.load(true);
    expect(rounds.items.value.map((r) => r.roundNo)).toEqual([5]);

    nickname.value = 'beta';
    await vi.waitFor(() => expect(rounds.items.value.map((r) => r.roundNo)).toEqual([9]));
  });
});
