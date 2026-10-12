import type { AdminMeDto } from '@dodep/shared';

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/auth') return;
  const me = useAdminMe();
  if (me.value) return;
  try {
    me.value = await useApi()<AdminMeDto>('/admin/me');
  } catch {
    return navigateTo('/auth', { replace: true });
  }
});
