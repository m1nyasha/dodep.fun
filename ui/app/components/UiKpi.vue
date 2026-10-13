<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    format?: 'int' | 'pct' | 'signed';
    hint?: string;
    tone?: 'pos' | 'neg';
  }>(),
  { format: 'int', hint: undefined, tone: undefined },
);

const root = useTemplateRef<HTMLElement>('root');
const seen = useReveal(root);
const shown = useCountUp(() => (seen.value ? props.value : 0), { from: 0, duration: 1_000 });
const text = computed(() =>
  props.format === 'pct' ? pct(shown.value) : props.format === 'signed' ? signed(shown.value) : fmt(shown.value),
);
</script>

<template>
  <div ref="root" class="kpi">
    <span>{{ label }}</span>
    <b class="mono" :class="tone">{{ text }}</b>
    <small v-if="hint">{{ hint }}</small>
  </div>
</template>

<style scoped>
.kpi {
  min-width: 0;
  padding: 18px 20px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
}

span {
  display: block;
  font-size: 13px;
  color: var(--muted);
}

b {
  display: block;
  margin: 6px 0 2px;
  font: 600 clamp(22px, 2.5vw, 30px) var(--font-mono);
  letter-spacing: -0.04em;
  overflow-wrap: anywhere;
}

small {
  font-size: 12px;
  color: var(--muted);
}
</style>
