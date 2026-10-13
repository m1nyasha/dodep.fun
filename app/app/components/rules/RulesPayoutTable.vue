<script setup lang="ts">
import type { LadderStepDto } from '@dodep/shared';

defineProps<{ ladder: LadderStepDto[] }>();
const k = defineModel<number>('k', { required: true });
const { play } = useSfx();

function pick(next: number) {
  k.value = next;
  play('tap');
}
</script>

<template>
  <UiPanel class="wrap">
    <table>
      <thead>
        <tr>
          <th>Клеток</th>
          <th>Шанс</th>
          <th>Множитель</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="s in ladder"
          :key="s.k"
          :class="{ on: s.k === k }"
          :aria-selected="s.k === k"
          tabindex="0"
          @click="pick(s.k)"
          @keydown.enter.prevent="pick(s.k)"
          @keydown.space.prevent="pick(s.k)"
        >
          <td>{{ s.k }}</td>
          <td>{{ pct(s.chance) }}</td>
          <td>{{ fx(s.multiplier) }}</td>
        </tr>
      </tbody>
    </table>
  </UiPanel>
</template>

<style scoped>
.wrap {
  padding: 0 8px 8px;
  max-height: 560px;
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}
th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--card);
  padding: 18px 12px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-align: right;
}
td {
  padding: 6px 12px;
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  border-top: 1px solid var(--line);
}
th:first-child,
td:first-child {
  text-align: left;
}
tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}
tbody tr:hover {
  background: var(--paper);
}
tr.on,
tr.on:hover {
  background: var(--coin);
}
tr.on td {
  border-color: transparent;
  font-weight: 700;
}
</style>
