<script setup lang="ts">
import type { LadderStepDto } from '@dodep/shared';

const props = defineProps<{ ladder: LadderStepDto[]; done: number; next: number | null; boom: number | null }>();

const root = useTemplateRef<HTMLElement>('root');
const reduced = useReducedMotion();

function scroll() {
  const k = Math.min(props.ladder.length, props.done + 1);
  const rung = root.value?.querySelector<HTMLElement>(`[data-k="${k}"]`);
  if (!root.value || !rung) return;
  root.value.scrollTo({
    left: rung.offsetLeft - root.value.clientWidth / 2 + rung.offsetWidth / 2,
    behavior: reduced.value ? 'auto' : 'smooth',
  });
}

watch(
  () => props.done,
  () => nextTick(scroll),
);
onMounted(scroll);
</script>

<template>
  <div ref="root" class="ladder">
    <div
      v-for="s in ladder"
      :key="s.k"
      class="rung"
      :class="{ done: s.k <= done, next: s.k === next, boom: s.k === boom }"
      :data-k="s.k"
      :title="`${cellsText(s.k)} подряд: шанс ${pct(s.chance)}`"
    >
      <b class="mono">{{ fx(s.multiplier) }}</b>
      <small class="mono">{{ pct(s.chance) }}</small>
    </div>
  </div>
</template>

<style scoped>
.ladder {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 -22px;
  padding: 4px 22px 14px;
  mask-image: linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 40px), transparent);
}

.rung {
  flex: none;
  min-width: 76px;
  padding: 7px 10px 6px;
  border-radius: 11px;
  background: var(--c-2);
  text-align: center;
  transition:
    background 0.3s,
    transform 0.3s var(--spring);
}

.rung b {
  display: block;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.3s;
}

.rung small {
  display: block;
  margin-top: 1px;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--c-muted);
}

.done {
  background: #3b3015;
}

.done b {
  color: var(--coin);
}

.next {
  background: var(--key);
  transform: translateY(-3px);
}

.next b {
  color: var(--ink);
}

.next small {
  color: #6e6653;
}

.boom {
  background: #4a1f16;
}

.boom b {
  color: var(--mine);
}

@media (width <= 760px) {
  .ladder {
    margin: 0 -12px;
    padding: 4px 12px 12px;
  }

  .rung {
    min-width: 66px;
  }
}
</style>
