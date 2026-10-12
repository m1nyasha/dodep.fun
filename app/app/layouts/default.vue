<template>
  <div class="shell">
    <LayoutTopBar />
    <main class="page"><slot /></main>
    <LayoutFooter />
    <UiToasts />
    <AuthModal />
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

.page > :deep(*) {
  animation: rise 0.55s var(--out) both;
}

.page > :deep(*:nth-child(2)) {
  animation-delay: 0.06s;
}

.page > :deep(*:nth-child(3)) {
  animation-delay: 0.12s;
}

@media (width <= 760px) {
  .shell {
    padding-bottom: 84px;
  }

  .page {
    padding: 18px 14px 40px;
  }
}
</style>
