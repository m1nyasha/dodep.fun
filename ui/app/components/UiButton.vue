<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: 'ink' | 'line' | 'coin' | 'danger' | 'danger-line';
    size?: 'md' | 'sm';
    wide?: boolean;
    to?: string;
    loading?: boolean;
  }>(),
  { variant: 'ink', size: 'md' },
);

const attrs = useAttrs();
const classes = computed(() => ['btn', props.variant, props.size, { wide: props.wide }]);
</script>

<template>
  <NuxtLink v-if="to" v-bind="attrs" :to="to" :class="classes"><slot /></NuxtLink>
  <button
    v-else
    v-bind="attrs"
    :type="(attrs.type as 'button' | 'submit' | undefined) ?? 'button'"
    :class="classes"
    :disabled="loading || (attrs.disabled as boolean | undefined)"
    :aria-busy="loading ? 'true' : undefined"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14.5px;
  white-space: nowrap;
  transition:
    transform 0.15s,
    background 0.2s,
    box-shadow 0.2s,
    color 0.2s;
}

.btn:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
}

.btn:disabled {
  opacity: 0.4;
}

.btn :deep(.ui-icon) {
  width: 18px;
  height: 18px;
}

.sm {
  height: 34px;
  padding: 0 13px;
  font-size: 13px;
  border-radius: 9px;
}

.sm :deep(.ui-icon) {
  width: 16px;
  height: 16px;
}

.ink {
  background: var(--ink);
  color: var(--paper);
}

.ink:hover:not(:disabled) {
  background: #000;
}

.line {
  box-shadow: inset 0 0 0 1.5px var(--line-2);
}

.line:hover:not(:disabled) {
  box-shadow: inset 0 0 0 1.5px var(--ink);
}

.coin {
  background: var(--coin);
  color: var(--ink);
  box-shadow: 0 3px 0 var(--coin-d);
}

.coin:hover {
  filter: brightness(1.05);
}

.danger {
  background: var(--mine);
  color: #fff;
}

.danger-line {
  color: var(--neg);
  box-shadow: inset 0 0 0 1.5px #f0b4a6;
}

.danger-line:hover {
  background: var(--mine);
  color: #fff;
  box-shadow: none;
}

.wide {
  width: 100%;
}
</style>
