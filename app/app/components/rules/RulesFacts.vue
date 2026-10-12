<script setup lang="ts">
defineProps<{ startBalance: number; dailyTarget: number }>();
</script>

<template>
  <section class="facts">
    <div>
      <b class="mono">{{ fmt(startBalance) }}</b
      ><span>монет при регистрации</span>
    </div>
    <div>
      <b class="mono">12:00</b><span>по Москве баланс можно добрать до {{ fmt(dailyTarget) }}, если он ниже</span>
    </div>
    <div><b class="mono">0 ₽</b><span>монеты нельзя купить или вывести — это не деньги</span></div>
  </section>
</template>

<style scoped>
.facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 16px;
}
.facts div {
  padding: 20px 22px;
  border-radius: 20px;
  border: 1.5px dashed var(--line-2);
}
b {
  display: block;
  font-size: 28px;
  font-weight: 600;
}
span {
  color: var(--muted);
  font-size: 14px;
}
@media (width <= 760px) {
  .facts {
    grid-template-columns: 1fr;
  }
}
</style>
