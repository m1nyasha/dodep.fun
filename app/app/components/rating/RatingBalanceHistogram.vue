<script setup lang="ts">
import type { HistogramBucketDto } from '@dodep/shared';

const props = defineProps<{ buckets: HistogramBucketDto[]; mark: number | null; total: number }>();
const bars = useTemplateRef<HTMLElement>('bars');
const shown = useReveal(bars);
const max = computed(() => Math.max(1, ...props.buckets.map((b) => b.count)));
const label = (b: HistogramBucketDto) => (b.to === null ? `${kLabel(b.from)}+` : kLabel(b.from));
</script>

<template>
  <UiPanel title="Распределение балансов" class="histo">
    <template #actions
      ><UiTag tone="muted">n = {{ total }}</UiTag></template
    >
    <div ref="bars" class="bars" :class="{ in: shown }" role="list">
      <div
        v-for="(b, i) in buckets"
        :key="b.from"
        class="bar"
        :class="{ mark: b.from === mark }"
        role="listitem"
        :aria-label="`${label(b)}: ${b.count}`"
        :style="{ '--h': `${(b.count / max) * 100}%`, '--n': i }"
      >
        <em>{{ b.count }}</em
        ><i />
      </div>
    </div>
    <div class="labels" aria-hidden="true">
      <span v-for="b in buckets" :key="b.from">{{ label(b) }}</span>
    </div>
  </UiPanel>
</template>

<style scoped>
.histo {
  display: flex;
  flex-direction: column;
}
.bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-height: 170px;
  padding-top: 26px;
}
.bar {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.bar i {
  display: block;
  height: var(--h);
  min-height: 3px;
  border-radius: 7px 7px 3px 3px;
  background: var(--ink);
  transform: scaleY(0);
  transform-origin: bottom;
  transition:
    transform 0.8s var(--spring) calc(var(--n) * 55ms),
    background 0.2s;
}
.in .bar i {
  transform: scaleY(1);
}
.bar.mark i {
  background: var(--ai);
}
.bar:hover i {
  background: var(--coin);
}
.bar em {
  position: absolute;
  left: 50%;
  bottom: calc(var(--h) + 6px);
  transform: translateX(-50%);
  font:
    600 12px 'JetBrains Mono',
    monospace;
  font-style: normal;
  opacity: 0;
  transition: opacity 0.2s;
}
.bar:hover em {
  opacity: 1;
}
.labels {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.labels span {
  flex: 1;
  text-align: center;
  font:
    500 11px 'JetBrains Mono',
    monospace;
  color: var(--muted);
}
@media (prefers-reduced-motion: reduce) {
  .bar i {
    transform: none;
    transition: none;
  }
}
</style>
