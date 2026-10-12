<script setup lang="ts">
import type { FingerprintDto } from '@dodep/shared';

defineProps<{ items: FingerprintDto[] }>();
const EVENTS: Record<FingerprintDto['event'], string> = {
  register: 'регистрация',
  login: 'вход',
  register_denied: 'отказ',
};
</script>

<template>
  <div class="scroll">
    <table v-if="items.length">
      <thead>
        <tr>
          <th>Когда</th>
          <th>Событие</th>
          <th>IP</th>
          <th>Клиент</th>
          <th>Браузер</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(f, i) in items" :key="i">
          <td class="mono">{{ stamp(f.createdAt) }}</td>
          <td>{{ EVENTS[f.event] }}</td>
          <td class="mono">{{ f.ip }}</td>
          <td class="mono" :title="f.clientHash ?? ''">{{ f.clientHash?.slice(0, 10) ?? '—' }}</td>
          <td class="ua" :title="f.userAgent">{{ f.userAgent || '—' }} · {{ f.acceptLanguage || '—' }}</td>
        </tr>
      </tbody>
    </table>
    <UiEmpty v-else>Отпечатков нет.</UiEmpty>
  </div>
</template>

<style scoped>
.scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  color: var(--muted);
}

td {
  padding: 8px;
  border-top: 1px solid var(--line);
  white-space: nowrap;
}

.ua {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
