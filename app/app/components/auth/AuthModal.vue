<script setup lang="ts">
const { state, close } = useAuthModal();
</script>

<template>
  <UiModal v-model:open="state.open">
    <AuthForm :mode="state.mode" @done="close" />
  </UiModal>
</template>
