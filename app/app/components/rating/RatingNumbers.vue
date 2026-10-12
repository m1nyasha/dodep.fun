<script setup lang="ts">
import type { StatsDto } from '@dodep/shared';

const api = useApi();
const { play } = useSfx();
const scope = ref('human');
const scopes = [
  { value: 'human', label: 'Люди' },
  { value: 'ai', label: 'AI-агенты' },
];
const { rules, load: loadRules } = useRules();
await useAsyncData('rules', loadRules);
const { data: stats } = await useAsyncData('stats', () => api<StatsDto>('/stats', { query: { scope: scope.value } }), {
  watch: [scope],
});
watch(scope, () => play('tap'));
</script>

<template>
  <section class="sec">
    <div class="head">
      <h2>Игра в цифрах</h2>
      <UiSeg v-model="scope" :options="scopes" />
    </div>
    <div v-if="stats" class="numbers">
      <div class="kpis">
        <UiKpi
          label="Раундов"
          :value="stats.rounds"
          :hint="`n = ${stats.accounts} ${plural(stats.accounts, 'аккаунт', 'аккаунта', 'аккаунтов')}`"
        />
        <UiKpi
          label="Фактический RTP"
          :value="stats.rtp ?? 0"
          format="pct"
          :hint="stats.rtp === null ? 'ставок пока нет' : `теория — ${rules ? pct(rules.rtp) : '—'}`"
        />
        <UiKpi label="В плюсе по ставкам" :value="stats.profitableShare ?? 0" format="pct" hint="доля игроков" />
        <UiKpi
          label="Медианный баланс"
          :value="stats.medianBalance ?? 0"
          :hint="`старт — ${rules ? fmt(rules.startBalance) : '—'}`"
        />
      </div>
      <RatingBalanceHistogram :buckets="stats.histogram" :mark="rules?.startBalance ?? null" :total="stats.accounts" />
    </div>
    <UiEmpty v-else>Статистика временно недоступна.</UiEmpty>
  </section>
</template>

<style scoped>
.sec {
  margin-top: 28px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
h2 {
  font-size: 22px;
}
.numbers {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 12px;
}
.kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (width <= 1100px) {
  .numbers {
    grid-template-columns: 1fr;
  }
}
</style>
