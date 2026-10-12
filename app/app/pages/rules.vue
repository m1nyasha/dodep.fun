<script setup lang="ts">
const { rules, load: loadRules } = useRules();
await useAsyncData('rules', loadRules);
const k = ref(3);

useSeoMeta({
  title: 'Правила — dodep.fun',
  description: () =>
    `Поле 5×5, пять мин, теоретический RTP ${rules.value ? pct(rules.value.rtp) : ''}: шансы, множители и выплаты для каждой клетки.`,
});
</script>

<template>
  <div>
    <PageIntro title="Правила">
      Поле 5×5, под пятью клетками — мины. Открывай по одной и забирай выплату, когда решишь остановиться.
    </PageIntro>
    <template v-if="rules">
      <RulesSteps :min-bet="rules.minBet" :bet-step="rules.betStep" />
      <section class="main">
        <RulesCalculator v-model:k="k" :rules="rules" />
        <RulesPayoutTable v-model:k="k" :ladder="rules.ladder" />
      </section>
      <RulesFacts :start-balance="rules.startBalance" :daily-target="rules.dailyTarget" />
    </template>
    <UiEmpty v-else big>Не удалось загрузить правила. Обнови страницу.</UiEmpty>
  </div>
</template>

<style scoped>
.main {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
  gap: 16px;
}
@media (width <= 1100px) {
  .main {
    grid-template-columns: 1fr;
  }
}
</style>
