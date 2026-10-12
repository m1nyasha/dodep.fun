import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReasonAction } from '../useReasonAction';

const { api, show, refresh } = vi.hoisted(() => ({ api: vi.fn(), show: vi.fn(), refresh: vi.fn() }));
mockNuxtImport('useApi', () => () => api);
mockNuxtImport('useToast', () => () => ({ show }));
mockNuxtImport('refreshNuxtData', () => refresh);

const target = {
  path: '/admin/accounts/mono/block',
  title: 'Заблокировать',
  confirmLabel: 'Заблокировать',
  description: 'mono',
  done: 'Заблокирован: mono',
};

describe('useReasonAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the reason, toasts, closes and refreshes', async () => {
    api.mockResolvedValue({});
    const action = useReasonAction();
    action.ask(target);
    expect(action.open.value).toBe(true);
    await action.run('спам');
    expect(api).toHaveBeenCalledWith('/admin/accounts/mono/block', { method: 'POST', body: { reason: 'спам' } });
    expect(show).toHaveBeenCalledWith('Заблокирован: mono', 'Записано в историю.', 'good');
    expect(action.open.value).toBe(false);
    expect(refresh).toHaveBeenCalled();
  });

  it('keeps the modal open and shows the error on failure', async () => {
    api.mockRejectedValue(Object.assign(new Error('x'), { message: 'Аккаунт не найден' }));
    const action = useReasonAction();
    action.ask(target);
    await action.run('спам');
    expect(show).toHaveBeenCalledWith('Не получилось', expect.any(String), 'bad');
    expect(action.open.value).toBe(true);
  });
});
