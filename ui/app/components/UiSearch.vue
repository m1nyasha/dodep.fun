<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{ placeholder?: string }>();
</script>

<template>
  <label class="search">
    <UiIcon name="search" />
    <input v-model="model" type="search" :placeholder="placeholder" :aria-label="placeholder ?? 'Поиск'" />
  </label>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border-radius: 11px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  color: var(--muted);
  transition: border-color 0.15s;
}

.search:focus-within {
  border-color: var(--ink);
  color: var(--ink);
}

.search :deep(.ui-icon) {
  width: 17px;
  height: 17px;
}

input {
  flex: 1;
  min-width: 0;
  width: 180px;
  border: 0;
  outline: 0;
  background: none;
  color: var(--ink);
}
</style>
