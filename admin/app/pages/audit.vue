<script setup lang="ts">
import type { AdminActionsPageDto } from '@dodep/shared';

const api = useApi();
// ponytail: история листается увеличением limit до 100 — перейти на offset-пагинацию, когда действий станет больше.
const limit = ref(30);
const { data } = useAsyncData(
  'admin-audit',
  () => api<AdminActionsPageDto>('/admin/audit', { query: { limit: limit.value } }),
  {
    watch: [limit],
  },
);
</script>

<template>
  <div class="page">
    <header class="intro"><h1>История действий</h1></header>
    <UiPanel>
      <AuditList :items="data?.items ?? []" />
      <UiButton
        v-if="data && data.total > data.items.length"
        variant="line"
        size="sm"
        class="more"
        @click="limit += 30"
      >
        Показать ещё · {{ data.total - data.items.length }}
      </UiButton>
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

.more {
  margin-top: 12px;
}
</style>
