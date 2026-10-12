<script setup lang="ts">
import { fnv1a } from '../utils/hash';

const props = withDefaults(defineProps<{ name: string; kind?: 'human' | 'ai' | 'me'; size?: number }>(), {
  kind: 'human',
  size: 36,
});

const cells = computed(() => {
  const h = fnv1a(props.name);
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if (!((h >> (y * 3 + x)) & 1)) continue;
      out.push({ x, y });
      if (x < 2) out.push({ x: 4 - x, y });
    }
  }
  return out;
});
</script>

<template>
  <span class="ava" :class="kind" :style="{ '--s': `${size}px` }">
    <svg viewBox="-.5 -.5 6 6" aria-hidden="true">
      <rect v-for="c in cells" :key="`${c.x}-${c.y}`" :x="c.x" :y="c.y" width="1" height="1" />
    </svg>
  </span>
</template>

<style scoped>
.ava {
  width: var(--s);
  height: var(--s);
  border-radius: calc(var(--s) * 0.28);
  display: inline-grid;
  place-items: center;
  flex: none;
  background: var(--paper-2);
  color: var(--ink);
}

svg {
  width: 64%;
  height: 64%;
  fill: currentcolor;
}

.ai {
  background: #e1e5ff;
  color: var(--ai);
}

.me {
  background: var(--coin);
  color: var(--ink);
}
</style>
