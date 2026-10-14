import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import type { RouteLocationNormalized } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import auth from '../auth.global';

const { api, navigate, me } = vi.hoisted(() => ({
  api: vi.fn(),
  navigate: vi.fn(),
  me: { value: null },
}));
mockNuxtImport('useApi', () => () => api);
mockNuxtImport('useAdminMe', () => () => me);
mockNuxtImport('navigateTo', () => navigate);

describe('admin auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    me.value = null;
    api.mockRejectedValue(new Error('UNAUTHORIZED'));
  });

  it.each(['/auth', '/auth/'])('preserves the login ticket on %s before exchange', async (path) => {
    const route = { path, query: { ticket: 'one-time-login-ticket' } } as unknown as RouteLocationNormalized;
    await auth(route, route);
    expect(api).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(route.query.ticket).toBe('one-time-login-ticket');
  });

  it('still redirects an unauthenticated protected page to login', async () => {
    const route = { path: '/accounts/', query: {} } as RouteLocationNormalized;
    await auth(route, route);
    expect(api).toHaveBeenCalledWith('/admin/me');
    expect(navigate).toHaveBeenCalledWith('/auth', { replace: true });
  });
});
