import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AuthForm from '../AuthForm.vue';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function fill(mode: 'login' | 'register', nickname: string, password: string) {
  const w = await mountSuspended(AuthForm, { props: { mode } });
  await w.get('input[name="nickname"]').setValue(nickname);
  await w.get('input[name="password"]').setValue(password);
  return w;
}

describe('AuthForm', () => {
  it('validates before calling the API', async () => {
    const w = await fill('register', 'ab', 'short');
    await w.get('form').trigger('submit');
    expect(w.text()).toContain('3–20 символов: буквы, цифры или _');
    expect(w.text()).toContain('Нужно минимум 8 символов');
    expect(w.get('.check').classes()).toContain('err');
  });

  it('shows the registration limit message in the common block', async () => {
    registerEndpoint('/api/auth/register', {
      method: 'POST',
      handler: () => json(403, { code: 'REGISTRATION_UNAVAILABLE', message: 'Регистрация пока недоступна, повторите попытку позже' }),
    });
    const w = await fill('register', 'kletka17', 'password123');
    await w.get('input[name="agree"]').setValue(true);
    await w.get('form').trigger('submit');
    await flushPromises();
    expect(w.get('.form-error').text()).toBe('Регистрация пока недоступна, повторите попытку позже');
    expect(w.emitted('done')).toBeUndefined();
  });

  it('maps a taken nickname to the nickname field', async () => {
    registerEndpoint('/api/auth/register', {
      method: 'POST',
      handler: () => json(409, { code: 'NICKNAME_TAKEN', message: 'Этот ник уже занят' }),
    });
    const w = await fill('register', 'mono', 'password123');
    await w.get('input[name="agree"]').setValue(true);
    await w.get('form').trigger('submit');
    await flushPromises();
    expect(w.get('[data-field="nickname"] .field-msg').text()).toBe('Этот ник уже занят');
  });

  it('logs in and emits done', async () => {
    registerEndpoint('/api/auth/login', { method: 'POST', handler: () => new Response(null, { status: 204 }) });
    registerEndpoint('/api/me', () => ({
      nickname: 'felix',
      balance: 10_000,
      wagered: 0,
      payout: 0,
      net: 0,
      roundsCount: 0,
      rank: 1,
      humanRank: 1,
      status: null,
      statusHidden: false,
      nextDailyAt: '2026-10-13T09:00:00.000Z',
      dailyTarget: 10_000,
      adminUrl: null,
    }));
    const w = await fill('login', 'felix', 'password123');
    await w.get('form').trigger('submit');
    await flushPromises();
    expect(w.emitted('done')).toHaveLength(1);
  });
});
