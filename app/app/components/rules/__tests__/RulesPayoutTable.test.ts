// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import RulesPayoutTable from '../RulesPayoutTable.vue';

const ladder = [
  { k: 1, chance: 0.8, multiplier: 1.21625 },
  { k: 2, chance: 0.633333, multiplier: 1.536316 },
];

describe('RulesPayoutTable', () => {
  it('highlights the current depth and emits a new one on click and Enter', async () => {
    const w = await mountSuspended(RulesPayoutTable, { props: { ladder, k: 1 } });
    const rows = w.findAll('tbody tr');
    expect(rows[0]!.classes()).toContain('on');
    await rows[1]!.trigger('click');
    await rows[0]!.trigger('keydown', { key: 'Enter' });
    expect(w.emitted('update:k')).toEqual([[2], [1]]);
  });
});
