import type { MaybeElementRef } from '@vueuse/core';

export function useReveal(target: MaybeElementRef) {
  const seen = ref(false);
  const reduced = useReducedMotion();
  const { stop } = useIntersectionObserver(
    target,
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      seen.value = true;
      stop();
    },
    { threshold: 0.15 },
  );
  watchEffect(() => {
    if (reduced.value) seen.value = true;
  });
  return readonly(seen);
}
