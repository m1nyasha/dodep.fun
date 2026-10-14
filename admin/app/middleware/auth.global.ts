import type { AdminMeDto } from '@dodep/shared';

export default defineNuxtRouteMiddleware(async (to) => {
  // nginx redirects the generated /auth directory to /auth/ in production.
  // Let the login page exchange its ticket before checking the admin session.
  if (to.path === '/auth' || to.path === '/auth/') return;
  const me = useAdminMe();
  if (me.value) return;
  try {
    me.value = await useApi()<AdminMeDto>('/admin/me');
  } catch {
    return navigateTo('/auth', { replace: true });
  }
});
