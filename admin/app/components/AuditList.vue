<script setup lang="ts">
import type { AdminActionDto } from '@dodep/shared';

defineProps<{ items: AdminActionDto[] }>();
</script>

<template>
  <ol v-if="items.length" class="audit">
    <li v-for="a in items" :key="a.id">
      <b
        >{{ actionLabel(a.action) }}<template v-if="a.target"> · {{ a.target }}</template></b
      >
      <span>{{ a.reason || '—' }} · {{ a.admin }}</span>
      <small class="mono">{{ stamp(a.createdAt) }}</small>
    </li>
  </ol>
  <UiEmpty v-else>Действий пока не было.</UiEmpty>
</template>

<style scoped>
.audit {
  list-style: none;
  margin: 0;
  padding: 0;
}

.audit li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 14px;
  padding: 11px 0 11px 14px;
  border-top: 1px solid var(--line);
  box-shadow: inset 3px 0 0 var(--coin);
}

.audit li:first-child {
  border-top: 0;
}

.audit span {
  grid-column: 1;
  font-size: 13.5px;
  color: var(--muted);
}

.audit small {
  grid-row: 1 / 3;
  grid-column: 2;
  align-self: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
