import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import UiButton from '../UiButton.vue';

describe('UiButton', () => {
  it('renders a plain button by default', async () => {
    const w = await mountSuspended(UiButton, { slots: { default: () => 'Играть' } });
    const btn = w.get('button');
    expect(btn.attributes('type')).toBe('button');
    expect(btn.classes()).toEqual(expect.arrayContaining(['btn', 'ink', 'md']));
    expect(btn.text()).toBe('Играть');
  });

  it('renders a link when "to" is set', async () => {
    const w = await mountSuspended(UiButton, { props: { to: '/auth', variant: 'line', size: 'sm' } });
    expect(w.get('a').attributes('href')).toBe('/auth');
    expect(w.get('a').classes()).toEqual(expect.arrayContaining(['line', 'sm']));
  });

  it('disables itself while loading and keeps a submit type', async () => {
    const w = await mountSuspended(UiButton, { props: { loading: true }, attrs: { type: 'submit' } });
    expect(w.get('button').attributes()).toMatchObject({ type: 'submit', disabled: '', 'aria-busy': 'true' });
  });
});
