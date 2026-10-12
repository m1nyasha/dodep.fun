<script setup lang="ts">
import { CELLS } from '@dodep/shared';

const props = withDefaults(
  defineProps<{
    mines?: readonly number[];
    picks?: readonly number[];
    hit?: number | null;
    lit?: readonly number[];
    size?: 'sm' | 'md';
  }>(),
  { mines: () => [], picks: () => [], hit: null, lit: () => [], size: 'sm' },
);

const cells = computed(() =>
  Array.from({ length: CELLS }, (_, i) => {
    if (i === props.hit) return ['m', 'hit'];
    if (props.mines.includes(i)) return ['m'];
    return props.picks.includes(i) || props.lit.includes(i) ? ['s'] : [];
  }),
);
</script>

<template>
  <div class="mini" :class="size" aria-hidden="true">
    <i v-for="(cls, i) in cells" :key="i" :class="cls" />
  </div>
</template>

<style scoped>
.mini {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  width: 92px;
}
.mini.md {
  flex: none;
  width: 132px;
  padding: 9px;
  border-radius: 12px;
  background: var(--c-bg);
}
i {
  aspect-ratio: 1;
  border-radius: 3px;
  background: var(--key);
}
i.s {
  background: var(--coin);
}
i.m {
  background: color-mix(in srgb, var(--mine) 30%, var(--c-bg));
}
i.hit {
  background: var(--mine);
  box-shadow: 0 0 0 2px var(--c-text);
}
</style>
