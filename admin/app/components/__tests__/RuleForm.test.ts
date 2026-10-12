import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import RuleForm from '../RuleForm.vue';

const initial = { rtp: 0.973, minBet: 100, betStep: 100, startBalance: 10_000, dailyTarget: 10_000 };

describe('RuleForm', () => {
  it('blocks invalid input with a field message', async () => {
    const wrapper = await mountSuspended(RuleForm, { props: { initial } });
    await wrapper.find('input[name="minBet"]').setValue('150');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain('Минимальная ставка должна быть кратна шагу');
  });

  it('submits numbers and the optional reason', async () => {
    const wrapper = await mountSuspended(RuleForm, { props: { initial } });
    await wrapper.find('input[name="rtp"]').setValue('0.95');
    await wrapper.find('input[name="reason"]').setValue('эксперимент');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toEqual([[{ ...initial, rtp: 0.95, reason: 'эксперимент' }]]);
  });
});
