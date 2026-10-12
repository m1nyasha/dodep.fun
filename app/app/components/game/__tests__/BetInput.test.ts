import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import GameBetInput from '../BetInput.vue';

const mount = (modelValue: number, max = 1_000) =>
  mountSuspended(GameBetInput, { props: { modelValue, min: 100, step: 100, max } });

const chip = async (w: Awaited<ReturnType<typeof mount>>, label: string) => {
  await w
    .findAll('.chips button')
    .find((b) => b.text() === label)!
    .trigger('click');
};

describe('GameBetInput', () => {
  it('applies chips within the limits', async () => {
    const w = await mount(300);
    await chip(w, '×2');
    await chip(w, 'Макс');
    await chip(w, '1к');
    expect(w.emitted('update:modelValue')?.map((e) => e[0])).toEqual([600, 1_000]);
  });

  it('never goes below the minimum', async () => {
    const w = await mount(100);
    await chip(w, '/2');
    await w.get('button[aria-label="Уменьшить ставку"]').trigger('click');
    expect(w.emitted('update:modelValue')).toBeUndefined();
  });

  it('commits typed text on blur rounded to the step', async () => {
    const w = await mount(100);
    const input = w.get('input');
    await input.setValue('2 5 0');
    await input.trigger('blur');
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([300]);
  });

  it('shrinks the bet when the max drops', async () => {
    const w = await mount(800);
    await w.setProps({ max: 500 });
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([500]);
  });
});
