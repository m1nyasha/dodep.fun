<script setup lang="ts">
import type { ExportFormat, ExportKind } from '@dodep/shared';

const kind = ref<ExportKind>('rounds');
const format = ref<ExportFormat>('csv');
const who = ref<'all' | 'true' | 'false'>('all');
const from = ref('');
const to = ref('');
const experimentId = ref('');

const url = computed(() =>
  exportUrl({
    kind: kind.value,
    format: format.value,
    isAi: who.value === 'all' ? undefined : who.value,
    from: from.value || undefined,
    to: to.value || undefined,
    experimentId: experimentId.value.trim() || undefined,
  }),
);
</script>

<template>
  <div class="page">
    <header class="intro">
      <h1>Экспорт</h1>
      <p>Завершённые раунды или их клики — для графиков и монтажа. До 50 000 строк за раз.</p>
    </header>
    <UiPanel>
      <div class="grid">
        <div class="field">
          <span>Что</span>
          <UiSeg
            v-model="kind"
            :options="[
              { value: 'rounds', label: 'Раунды' },
              { value: 'actions', label: 'Клики' },
            ]"
          />
        </div>
        <div class="field">
          <span>Формат</span>
          <UiSeg
            v-model="format"
            :options="[
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ]"
          />
        </div>
        <div class="field">
          <span>Игроки</span>
          <UiSeg
            v-model="who"
            :options="[
              { value: 'all', label: 'Все' },
              { value: 'false', label: 'Люди' },
              { value: 'true', label: 'AI' },
            ]"
          />
        </div>
        <label class="field"><span>С</span><input v-model="from" type="date" /></label>
        <label class="field"><span>По</span><input v-model="to" type="date" /></label>
        <label class="field"
          ><span>Эксперимент</span><input v-model="experimentId" placeholder="id, необязательно" class="mono"
        /></label>
      </div>
      <a :href="url" class="download" download><UiIcon name="down" /> Скачать</a>
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

.intro p {
  margin: 8px 0 0;
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.field input {
  height: 42px;
  padding: 0 12px;
  border: 1.5px solid var(--line);
  border-radius: 11px;
  background: var(--paper);
  color: var(--ink);
}

.download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  margin-top: 16px;
  padding: 0 18px;
  border-radius: 12px;
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
}

@media (width <= 760px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
