<script setup lang="ts">
import type { AdminOverviewDto } from '@dodep/shared';

const { data } = useNuxtData<AdminOverviewDto>('admin-overview');
</script>

<template>
  <div class="page">
    <header class="intro"><h1>Обзор</h1></header>
    <div v-if="data" class="kpis">
      <UiKpi label="Аккаунтов" :value="data.accounts" :hint="`из них AI — ${fmt(data.aiAccounts)}`" />
      <UiKpi label="Заблокировано" :value="data.blocked" />
      <UiKpi label="Скрыто статусов" :value="data.hiddenStatuses" />
      <UiKpi label="Раундов" :value="data.rounds" :hint="`правила v${data.activeRuleVersion}`" />
    </div>
    <UiPanel title="Последние действия">
      <template #actions><NuxtLink to="/audit" class="more">Вся история</NuxtLink></template>
      <AuditList :items="data?.recentActions ?? []" />
    </UiPanel>
  </div>
</template>

<style scoped>
.page {
  display: contents;
}

.intro h1 {
  font-size: clamp(28px, 4vw, 40px);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.more {
  font-size: 13px;
  color: var(--muted);
}

@media (width <= 900px) {
  .kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
