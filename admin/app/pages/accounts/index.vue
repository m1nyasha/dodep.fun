<script setup lang="ts">
import type { AdminAccountDto, AdminAccountsPageDto } from '@dodep/shared';
import { refDebounced } from '@vueuse/core';

const api = useApi();
const q = ref('');
const query = refDebounced(q, 250);
const limit = ref(30);
const { data } = useAsyncData(
  'admin-accounts',
  () => api<AdminAccountsPageDto>('/admin/accounts', { query: { q: query.value || undefined, limit: limit.value } }),
  { watch: [query, limit] },
);
const action = useReasonAction();

function toggle(account: AdminAccountDto) {
  const blocked = Boolean(account.blockedAt);
  const verb = blocked ? 'Разблокировать' : 'Заблокировать';
  action.ask({
    path: `/admin/accounts/${encodeURIComponent(account.nickname)}/${blocked ? 'unblock' : 'block'}`,
    title: verb,
    confirmLabel: verb,
    danger: !blocked,
    description: `${account.nickname}. Причина попадёт в историю действий — её можно будет проверить и отменить.`,
    done: `${blocked ? 'Разблокирован' : 'Заблокирован'}: ${account.nickname}`,
  });
}
</script>

<template>
  <div class="page">
    <header class="intro"><h1>Аккаунты</h1></header>
    <UiPanel>
      <UiSearch v-model="q" placeholder="Никнейм" />
      <div class="rows">
        <AccountRow v-for="a in data?.items ?? []" :key="a.nickname" :account="a" @toggle="toggle" />
        <UiEmpty v-if="data && !data.items.length">Не найдено.</UiEmpty>
      </div>
      <UiButton
        v-if="data && data.total > data.items.length"
        variant="line"
        size="sm"
        class="more"
        @click="limit = Math.min(100, limit + 30)"
      >
        Показать ещё · {{ data.total - data.items.length }}
      </UiButton>
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

.rows {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.more {
  margin-top: 12px;
}
</style>
