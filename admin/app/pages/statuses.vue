<script setup lang="ts">
import type { AdminStatusDto } from '@dodep/shared';

const api = useApi();
const { data } = useAsyncData('admin-statuses', () => api<AdminStatusDto[]>('/admin/statuses'));
const action = useReasonAction();

function toggle(s: AdminStatusDto) {
  const hidden = Boolean(s.hiddenAt);
  action.ask({
    path: `/admin/statuses/${encodeURIComponent(s.nickname)}/${hidden ? 'show' : 'hide'}`,
    title: hidden ? 'Показать статус' : 'Скрыть статус',
    confirmLabel: hidden ? 'Показать' : 'Скрыть',
    danger: !hidden,
    description: `${s.nickname}: «${s.text}». Скрытие не трогает аккаунт и рейтинг.`,
    done: `${hidden ? 'Статус показан' : 'Статус скрыт'}: ${s.nickname}`,
  });
}
</script>

<template>
  <div class="page">
    <header class="intro">
      <h1>Публичные статусы</h1>
      <p>Публикуются сразу. Видны только у пятёрки лучших людей.</p>
    </header>
    <UiPanel>
      <div class="rows">
        <div v-for="s in data ?? []" :key="s.nickname" class="arow" :class="{ off: s.hiddenAt }">
          <UiAvatar :name="s.nickname" :size="32" />
          <div class="grow">
            <NuxtLink :to="`/accounts/${encodeURIComponent(s.nickname)}`" class="name">{{ s.nickname }}</NuxtLink>
            <UiTag v-if="s.humanRank && s.humanRank <= 5" tone="top">топ-{{ s.humanRank }}</UiTag>
            <small>«{{ s.text }}»<template v-if="s.hiddenAt"> · скрыт</template></small>
          </div>
          <UiButton size="sm" variant="line" @click="toggle(s)">{{ s.hiddenAt ? 'Показать' : 'Скрыть' }}</UiButton>
        </div>
        <UiEmpty v-if="data && !data.length">Статусов пока нет.</UiEmpty>
      </div>
    </UiPanel>
    <ReasonModal
      v-if="action.target.value"
      v-model:open="action.open.value"
      :title="action.target.value.title"
      :confirm-label="action.target.value.confirmLabel"
      :description="action.target.value.description"
      :danger="action.target.value.danger"
      @confirm="action.run"
    />
  </div>
</template>

<style scoped>
.page {
  display: contents;
}

.intro h1 {
  font-size: clamp(28px, 4vw, 40px);
}

.intro p {
  margin: 8px 0 0;
  color: var(--muted);
}

.rows {
  display: flex;
  flex-direction: column;
}

.arow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px solid var(--line);
}

.arow:first-child {
  border-top: 0;
}

.arow.off {
  opacity: 0.55;
}

.grow {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  margin-right: 6px;
}

.grow small {
  display: block;
  font-size: 12.5px;
  color: var(--muted);
}
</style>
