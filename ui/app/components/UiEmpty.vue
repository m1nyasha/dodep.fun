<script setup lang="ts">
defineProps<{ big?: boolean }>();
</script>

<template>
  <div class="empty" :class="{ big }"><slot /></div>
</template>

<style scoped>
.empty {
  padding: 18px 0;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

.empty :deep(a) {
  color: var(--ink);
  border-bottom: 1px solid var(--line-2);
}

.big {
  padding: 48px 20px;
  font-size: 15px;
}
</style>
