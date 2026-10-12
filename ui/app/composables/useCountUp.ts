import { TransitionPresets } from '@vueuse/core';

export function useCountUp(source: MaybeRefOrGetter<number>, opts: { duration?: number; from?: number } = {}) {
  const reduced = useReducedMotion();
  const target = shallowRef(opts.from ?? toValue(source));
  onMounted(() => watch(() => toValue(source), (v) => (target.value = v), { immediate: true }));
  if (import.meta.server) target.value = toValue(source);
  return useTransition(target, {
    duration: opts.duration ?? 600,
    easing: TransitionPresets.easeOutQuart,
    disabled: reduced,
  });
}
