// @vitest-environment nuxt
import type { FinishedRoundDto, RoundsPageDto } from '@dodep/shared';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { useJournal } from '../useJournal';

const round = (roundNo: number) => ({ id: `r${roundNo}`, roundNo }) as FinishedRoundDto;

describe('useJournal', () => {
  it('follows the cursor and resets on reload', async () => {
    const cursors: (string | null)[] = [];
    registerEndpoint('/api/rounds', (event: { path?: string; url?: URL }): RoundsPageDto => {
      const cursor = new URL(String(event.path ?? event.url), 'http://test').searchParams.get('cursor');
      cursors.push(cursor);
      return cursor ? { items: [round(1)], nextCursor: null } : { items: [round(3), round(2)], nextCursor: 2 };
    });
    const journal = useJournal(2);
    await journal.load(true);
    expect(journal.nextCursor.value).toBe(2);
    await journal.loadMore();
    expect(journal.items.value.map((r) => r.roundNo)).toEqual([3, 2, 1]);
    expect(journal.nextCursor.value).toBeNull();
    await journal.load(true);
    expect(journal.items.value.map((r) => r.roundNo)).toEqual([3, 2]);
    expect(cursors).toEqual([null, '2', null]);
  });
});
