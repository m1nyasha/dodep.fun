<template>
  <footer class="foot">
    <span>dodep.fun — игра на виртуальные монеты. Без покупки, депозита и вывода.</span>
    <span class="links">
      <NuxtLink to="/rules">Правила</NuxtLink>
      <NuxtLink to="/journal">Проверка раундов</NuxtLink>
    </span>
  </footer>
</template>

<style scoped>
.foot {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 22px 24px 30px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}

.links {
  display: flex;
  gap: 18px;
}

a:hover {
  color: var(--ink);
}

@media (width <= 760px) {
  .foot {
    padding: 20px 14px 24px;
  }
}
</style>
