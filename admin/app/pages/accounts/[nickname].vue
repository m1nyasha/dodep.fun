<script setup lang="ts">
import type { AdminAccountDetailDto } from '@dodep/shared';

const api = useApi();
const route = useRoute();
const nickname = computed(() => String(route.params.nickname));
const { data, error } = useAsyncData(
  () => `admin-account-${nickname.value}`,
  () => api<AdminAccountDetailDto>(`/admin/accounts/${encodeURIComponent(nickname.value)}`),
);
const action = useReasonAction();

function toggle() {
  const account = data.value?.account;
  if (!account) return;
  const blocked = Boolean(account.blockedAt);
  action.ask({
    path: `/admin/accounts/${encodeURIComponent(account.nickname)}/${blocked ? 'unblock' : 'block'}`,
    title: blocked ? 'Разблокировать' : 'Заблокировать',
    confirmLabel: blocked ? 'Разблокировать' : 'Заблокировать',
    danger: !blocked,
    description: `${account.nickname}. Причина попадёт в историю действий.`,
    done: `${blocked ? 'Разблокирован' : 'Заблокирован'}: ${account.nickname}`,
  });
}

function adjustCoins(amount: number) {
  const account = data.value?.account;
  if (!account) return;
  action.ask({
    path: `/admin/accounts/${encodeURIComponent(account.nickname)}/coins`,
    title: amount > 0 ? 'Начислить монеты' : 'Списать монеты',
    confirmLabel: amount > 0 ? 'Начислить' : 'Списать',
    danger: amount < 0,
    description: `${account.nickname}: ${signed(amount)} монет. Причина попадёт в историю действий.`,
    done: `${signed(amount)} монет: ${account.nickname}`,
    extraBody: { amount },
  });
}
</script>

<template>
  <div class="page">
    <NuxtLink to="/accounts" class="back">← Аккаунты</NuxtLink>
    <UiEmpty v-if="error" big>Аккаунт не найден.</UiEmpty>
    <template v-else-if="data">
      <UiPanel>
        <AccountRow :account="data.account" @toggle="toggle" />
        <dl class="meta">
          <div>
            <dt>Создан</dt>
            <dd class="mono">{{ stamp(data.account.createdAt) }}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>
              {{ data.status.text ? `«${data.status.text}»` : '—'
              }}<template v-if="data.status.hiddenAt"> · скрыт</template>
            </dd>
          </div>
          <div v-if="data.account.blockedAt">
            <dt>Блокировка</dt>
            <dd>{{ stamp(data.account.blockedAt) }} · {{ data.account.blockReason }}</dd>
          </div>
        </dl>
      </UiPanel>
      <UiPanel title="Монеты">
        <CoinsForm @submit="adjustCoins" />
      </UiPanel>
      <UiPanel title="Связанные аккаунты">
        <ul v-if="data.related.length" class="related">
          <li v-for="r in data.related" :key="`${r.via}-${r.nickname}-${r.value}`">
            <NuxtLink :to="`/accounts/${encodeURIComponent(r.nickname)}`">{{ r.nickname }}</NuxtLink>
            <UiTag tone="muted">{{ r.via === 'ip' ? 'IP' : 'клиент' }}</UiTag>
            <span class="mono">{{ r.via === 'ip' ? r.value : r.value.slice(0, 10) }}</span>
            <UiTag v-if="r.blocked" tone="muted">заблокирован</UiTag>
          </li>
        </ul>
        <UiEmpty v-else>Совпадений по IP и отпечатку клиента нет.</UiEmpty>
      </UiPanel>
      <UiPanel title="Отпечатки"><FingerprintTable :items="data.fingerprints" /></UiPanel>
    </template>
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

.back {
  font-size: 14px;
  color: var(--muted);
}

.meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 12px 0 0;
}

.meta div {
  padding: 12px 14px;
  border-radius: 13px;
  background: var(--paper);
}

.meta dt {
  font-size: 12px;
  color: var(--muted);
}

.meta dd {
  margin: 3px 0 0;
  font-weight: 600;
}

.related {
  list-style: none;
  margin: 0;
  padding: 0;
}

.related li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-top: 1px solid var(--line);
}

.related li:first-child {
  border-top: 0;
}
</style>
