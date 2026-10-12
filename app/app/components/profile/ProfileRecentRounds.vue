<script setup lang="ts">
import type { RoundsPageDto } from '@dodep/shared';

const api = useApi();
const { data } = await useAsyncData('recent-rounds', () => api<RoundsPageDto>('/rounds', { query: { limit: 8 } }));
const rounds = computed(() => data.value?.items ?? []);
</script>

<template>
  <UiPanel title="Последние раунды">
    <template #actions><NuxtLink class="link" to="/journal">Журнал</NuxtLink></template>
    <ol class="hist">
      <li v-for="r in rounds" :key="r.id" :class="r.status === 'cashed_out' ? 'win' : 'lose'">
        <i class="h-dot" />
        <span>
          {{ r.status === 'cashed_out' ? fx(r.multiplier) : 'Мина' }}
          <small>ставка {{ fmt(r.bet) }} · {{ ago(r.finishedAt) }}</small>
        </span>
        <b class="mono" :class="r.net >= 0 ? 'pos' : 'neg'">{{ signed(r.net) }}</b>
      </li>
      <li v-if="!rounds.length" class="empty">
        <UiEmpty>Раундов пока нет. <NuxtLink to="/">К игре</NuxtLink></UiEmpty>
      </li>
    </ol>
  </UiPanel>
</template>

<style scoped>
.link {
  font-size: 13.5px;
  color: var(--muted);
}
.link:hover {
  color: var(--ink);
}
.hist {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 11px;
  align-items: center;
  padding: 9px 0;
  border-top: 1px solid var(--line);
}
li:first-child {
  border-top: 0;
}
li.empty {
  display: block;
}
span {
  font-weight: 600;
  font-size: 14px;
}
small {
  display: block;
  font-weight: 400;
  font-size: 12px;
  color: var(--muted);
}
b {
  font-size: 14px;
}
.h-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--coin);
}
.lose .h-dot {
  background: var(--mine);
}
</style>
