<script setup lang="ts">
import type { RoundDto } from '@dodep/shared';

const props = defineProps<{ round: RoundDto | null; flipping: number | null; nextLabel: string }>();
const emit = defineEmits<{ open: [cell: number, el: HTMLElement] }>();

const reduced = useReducedMotion();
const views = computed(() => tileViews(props.round, props.flipping));
const live = computed(() => props.round?.status === 'active');
const waving = ref(false);

watch(
  () => (props.round?.status === 'active' && props.round.safeCount === 0 ? props.round.id : null),
  (id) => {
    if (!id || reduced.value) return;
    waving.value = true;
    setTimeout(() => (waving.value = false), 900);
  },
);
</script>

<template>
  <div class="board" :class="{ live }" :style="{ '--next': `'${nextLabel}'` }" role="group" aria-label="Поле 5×5">
    <GameTile
      v-for="(view, i) in views"
      :key="i"
      :index="i"
      :view="view"
      :live="live"
      :wave="waving"
      @open="(el) => emit('open', i, el)"
    />
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 14px 14px 18px;
  border-radius: 22px;
  background: #11100c;
  box-shadow:
    inset 0 3px 12px #000c,
    0 1px 0 #ffffff12;
  perspective: 600px;
}

.board:not(.live) :deep(.tile:not(.open)) {
  cursor: default;
}

@media (width <= 760px) {
  .board {
    gap: 6px;
    padding: 9px 9px 12px;
    border-radius: 17px;
  }
}
</style>
