<script setup lang="ts">
import type { RuleVersionFields } from '@dodep/shared';

const props = defineProps<{ rule: RuleVersionFields }>();
const items = computed(() => [
  ['Поле', '5 × 5'],
  ['Мины', '5'],
  ['Теоретический RTP', pct(props.rule.rtp)],
  ['Ставка', `от ${fmt(props.rule.minBet)}, шаг ${fmt(props.rule.betStep)}`],
  ['Стартовый баланс', fmt(props.rule.startBalance)],
  ['Ежедневно', `до ${fmt(props.rule.dailyTarget)} · 12:00 МСК`],
  ['RNG', 'crypto · CSPRNG'],
]);
</script>

<template>
  <dl class="cfg">
    <div v-for="[k, v] in items" :key="k">
      <dt>{{ k }}</dt>
      <dd class="mono">{{ v }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.cfg {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 6px 0 0;
}

.cfg div {
  padding: 13px 14px;
  border-radius: 13px;
  background: var(--paper);
}

.cfg dt {
  font-size: 12px;
  color: var(--muted);
}

.cfg dd {
  margin: 3px 0 0;
  font-size: 15px;
  font-weight: 600;
}

@media (width <= 900px) {
  .cfg {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
