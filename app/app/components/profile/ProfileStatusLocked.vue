<script setup lang="ts">
import type { LeaderboardDto, PlayerDto } from '@dodep/shared';

const props = defineProps<{ player: PlayerDto }>();
const api = useApi();
const { data: fifth } = await useAsyncData('fifth-human', () =>
  api<LeaderboardDto>('/leaderboard', { query: { filter: 'human', offset: 4, limit: 1 } }).then(
    (page) => page.items[0]?.balance ?? null,
  ),
);
const gap = computed(() => gapToFifth(props.player.balance, fifth.value ?? null));
const progress = computed(() => (fifth.value ? Math.min(100, (props.player.balance / fifth.value) * 100) : 0));
const bar = useTemplateRef<HTMLElement>('bar');
const shown = useReveal(bar);
</script>

<template>
  <UiPanel title="Публичный статус">
    <template #actions><UiIcon name="lock" /></template>
    <p class="muted">
      Статус открывается пятёрке лучших людей. Ты сейчас {{ player.humanRank }}-й среди людей<template v-if="gap > 0">
        — до пятого места не хватает <b class="gap mono">{{ fmt(gap) }}</b> монет</template
      >.
    </p>
    <div v-if="fifth" ref="bar" class="bar" :class="{ in: shown }">
      <i :style="{ '--w': `${progress}%` }" />
    </div>
  </UiPanel>
</template>

<style scoped>
p {
  margin: 0;
}
.bar {
  height: 8px;
  margin-top: 14px;
  border-radius: 4px;
  background: var(--paper-2);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  width: 0;
  border-radius: 4px;
  background: var(--ink);
  transition: width 1.2s var(--out) 0.2s;
}
.bar.in i {
  width: var(--w);
}
@media (prefers-reduced-motion: reduce) {
  .bar i {
    width: var(--w);
    transition: none;
  }
}
</style>
