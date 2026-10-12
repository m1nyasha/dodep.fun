import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, beforeEach } from 'vitest';
import { h, nextTick } from 'vue';
import UiModal from '../UiModal.vue';

const mount = (open: boolean) =>
  mountSuspended(UiModal, {
    props: { open, title: 'Заблокировать' },
    slots: { default: () => h('input', { id: 'reason' }), actions: () => h('button', 'OK') },
    attachTo: document.body,
  });

describe('UiModal', () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="teleports"></div>');
  });

  it('renders nothing when closed', async () => {
    await mount(false);
    expect(document.querySelector('[role="dialog"]')).toBe(null);
  });

  it('closes on Escape', async () => {
    const w = await mount(true);
    await nextTick();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-label')).toBe('Заблокировать');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(w.emitted('update:open')).toEqual([[false]]);
  });

  it('closes on backdrop click', async () => {
    const w = await mount(true);
    await nextTick();
    const modal = document.querySelector('.modal');
    expect(modal).toBeTruthy();
    modal?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(w.emitted('update:open')).toEqual([[false]]);
  });
});
