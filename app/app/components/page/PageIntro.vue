<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <header class="intro" :class="{ row: $slots.actions }">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="$slots.default"><slot /></p>
    </div>
    <div v-if="$slots.actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.intro {
  max-width: 660px;
  margin: 6px 0 26px;
}
.intro.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  max-width: none;
}
.intro.row > div:first-child {
  max-width: 660px;
}
h1 {
  font-size: clamp(30px, 4vw, 46px);
}
p {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 16px;
}
@media (width <= 760px) {
  .intro.row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
