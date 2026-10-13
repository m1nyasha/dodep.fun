export default defineNuxtRouteMiddleware((to) => {
  const { isAuthed } = useMe();
  if (isAuthed.value) return;
  return navigateTo(loginRedirectTo(to.fullPath));
});
