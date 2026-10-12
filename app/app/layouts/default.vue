<template>
  <div class="shell">
    <main class="page"><slot /></main>
    <UiToasts />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}
</style>
