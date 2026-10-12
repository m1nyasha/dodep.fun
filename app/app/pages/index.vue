<script setup lang="ts">
const { me } = useMe();
</script>

<template>
  <UiPanel title="dodep.fun">
    <p v-if="me">Привет, {{ me.nickname }} — <span class="mono">{{ fmt(me.balance) }}</span> <UiCoin /></p>
    <p v-else class="muted">Ты не вошёл.</p>
  </UiPanel>
</template>
