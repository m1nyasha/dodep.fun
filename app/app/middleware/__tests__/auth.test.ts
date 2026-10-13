// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMe } from '../../composables/useMe';

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn((to: string) => ({ to })) }));
mockNuxtImport('navigateTo', () => navigateToMock);

const middleware = (await import('../auth')).default;

describe('auth middleware', () => {
  beforeEach(() => {
    useMe().me.value = null;
    navigateToMock.mockClear();
  });

  it('sends a guest to /auth with a same-site redirect back to the page they wanted', () => {
    const result = middleware({ fullPath: '/journal?x=1' } as never, {} as never);
    expect(navigateToMock).toHaveBeenCalledWith('/auth?redirect=%2Fjournal%3Fx%3D1');
    expect(result).toEqual({ to: '/auth?redirect=%2Fjournal%3Fx%3D1' });
  });

  it('lets a signed-in player through', () => {
    useMe().me.value = { nickname: 'kletka17' } as never;
    const result = middleware({ fullPath: '/journal' } as never, {} as never);
    expect(navigateToMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
