import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import UiSeg from '../UiSeg.vue';

const options = [
  { value: 'all', label: 'Все' },
  { value: 'human', label: 'Люди' },
  { value: 'ai', label: 'AI' },
];

describe('UiSeg', () => {
  it('marks the active option and emits a new value on click', async () => {
    const w = await mountSuspended(UiSeg, { props: { modelValue: 'all', options } });
    const buttons = w.findAll('button');
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false', 'false']);
    await buttons[2]!.trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([['ai']]);
  });
});
