<script setup lang="ts">
defineProps<{ tone?: 'ai' | 'me' | 'top' | 'muted' }>();
</script>

<template>
  <em class="tag" :class="tone ?? 'muted'"><slot /></em>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: 700 10px/1.5 var(--font-mono);
  font-style: normal;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 5px;
  margin-left: 7px;
  vertical-align: 1px;
  white-space: nowrap;
}

.ai {
  background: var(--ai);
  color: #fff;
}

.me {
  background: var(--ink);
  color: var(--paper);
}

.top {
  background: var(--coin);
  color: var(--ink);
}

.muted {
  margin-left: 0;
  padding: 3px 8px;
  border-radius: 6px;
  font: 600 11px var(--font-mono);
  text-transform: none;
  color: var(--muted);
  background: var(--paper-2);
}

.tag :deep(.ui-icon) {
  width: 13px;
  height: 13px;
}
</style>
