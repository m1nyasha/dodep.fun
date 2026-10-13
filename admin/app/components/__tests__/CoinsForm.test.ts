import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import CoinsForm from '../CoinsForm.vue';

describe('CoinsForm', () => {
  it('blocks non-numeric input with a field message', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    await wrapper.find('input[name="amount"]').setValue('abc');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain('Введите целое число');
  });

  it('blocks a zero amount', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    await wrapper.find('input[name="amount"]').setValue('0');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain('Сумма не может быть нулевой');
  });

  it('blocks an amount over the limit', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    await wrapper.find('input[name="amount"]').setValue('1000000001');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain('Слишком большая сумма');
  });

  it('emits a parsed negative amount', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    await wrapper.find('input[name="amount"]').setValue('-500');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toEqual([[-500]]);
  });

  it('emits a parsed positive amount', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    await wrapper.find('input[name="amount"]').setValue('500');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toEqual([[500]]);
  });

  it('clears the amount after a successful adjustment', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    const input = wrapper.find<HTMLInputElement>('input[name="amount"]');
    await input.setValue('500');
    await wrapper.find('form').trigger('submit');
    (wrapper.vm as unknown as { onResult: (success: boolean) => void }).onResult(true);
    await wrapper.vm.$nextTick();
    expect(input.element.value).toBe('');
  });

  it('keeps the amount after a failed adjustment', async () => {
    const wrapper = await mountSuspended(CoinsForm);
    const input = wrapper.find<HTMLInputElement>('input[name="amount"]');
    await input.setValue('500');
    await wrapper.find('form').trigger('submit');
    (wrapper.vm as unknown as { onResult: (success: boolean) => void }).onResult(false);
    await wrapper.vm.$nextTick();
    expect(input.element.value).toBe('500');
  });
});
