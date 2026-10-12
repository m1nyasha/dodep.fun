export function useReducedMotion() {
  const preference = usePreferredReducedMotion();
  return computed(() => preference.value === 'reduce');
}
