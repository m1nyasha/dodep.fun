import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ReasonModal from '../ReasonModal.vue';

const find = (selector: string) => document.body.querySelector<HTMLElement>(selector)!;

describe('ReasonModal', () => {
  it('requires a reason before confirming', async () => {
    const wrapper = await mountSuspended(ReasonModal, {
      props: { open: true, title: 'Заблокировать', confirmLabel: 'Заблокировать' },
      attachTo: document.body,
    });
    find('[data-test="confirm"]').click();
    await nextTick();
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(find('[role="alert"]').textContent).toContain('Укажите причину');

    const textarea = find('textarea') as HTMLTextAreaElement;
    textarea.value = '  спам  ';
    textarea.dispatchEvent(new Event('input'));
    find('[data-test="confirm"]').click();
    await nextTick();
    expect(wrapper.emitted('confirm')).toEqual([['спам']]);
    wrapper.unmount();
  });

  it('allows an empty reason when optional', async () => {
    const wrapper = await mountSuspended(ReasonModal, {
      props: { open: true, title: 'Активировать', confirmLabel: 'Активировать', optional: true },
      attachTo: document.body,
    });
    find('[data-test="confirm"]').click();
    await nextTick();
    expect(wrapper.emitted('confirm')).toEqual([['']]);
    wrapper.unmount();
  });
});
