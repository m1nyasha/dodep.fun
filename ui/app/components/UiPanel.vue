<script setup lang="ts">
withDefaults(defineProps<{ title?: string; as?: string }>(), { as: 'section' });
</script>

<template>
  <component :is="as" class="panel">
    <header v-if="title || $slots.actions" class="head">
      <h2 v-if="title">{{ title }}</h2>
      <slot name="actions" />
    </header>
    <slot />
  </component>
</template>

<style scoped>
.panel {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 20px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
</style>
