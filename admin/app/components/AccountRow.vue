<script setup lang="ts">
import type { AdminAccountDto } from '@dodep/shared';

const props = defineProps<{ account: AdminAccountDto }>();
defineEmits<{ toggle: [account: AdminAccountDto] }>();
const blocked = computed(() => Boolean(props.account.blockedAt));
</script>

<template>
  <div class="arow" :class="{ off: blocked }">
    <UiAvatar :name="account.nickname" :kind="account.isAi ? 'ai' : 'human'" :size="32" />
    <div class="grow">
      <NuxtLink :to="`/accounts/${encodeURIComponent(account.nickname)}`" class="name">{{ account.nickname }}</NuxtLink>
      <UiTag v-if="account.isAi" tone="ai">AI</UiTag>
      <UiTag v-if="account.isAdmin" tone="muted">админ</UiTag>
      <small>
        баланс {{ fmt(account.balance) }} · итог {{ signed(account.net) }} · {{ fmt(account.roundsCount) }} раундов ·
        {{ blocked ? `заблокирован: ${account.blockReason}` : 'активен' }}
      </small>
    </div>
    <UiButton size="sm" :variant="blocked ? 'line' : 'danger-line'" @click="$emit('toggle', account)">
      {{ blocked ? 'Разблокировать' : 'Заблокировать' }}
    </UiButton>
  </div>
</template>

<style scoped>
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
