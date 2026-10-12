// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import JournalMiniBoard from '../JournalMiniBoard.vue';

describe('JournalMiniBoard', () => {
  it('marks mines, the hit and opened cells', async () => {
    const w = await mountSuspended(JournalMiniBoard, { props: { mines: [0, 1], picks: [5], hit: 1 } });
    const cells = w.findAll('i');
    expect(cells).toHaveLength(25);
    expect(cells[0]!.classes()).toContain('m');
    expect(cells[1]!.classes()).toEqual(expect.arrayContaining(['m', 'hit']));
    expect(cells[5]!.classes()).toContain('s');
    expect(cells[6]!.classes()).toEqual([]);
  });
});
