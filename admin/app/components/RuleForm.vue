<script setup lang="ts">
import { ruleInputErrors, type RuleVersionFields, type RuleVersionInput } from '@dodep/shared';

const props = defineProps<{ initial: RuleVersionFields }>();
const emit = defineEmits<{ submit: [input: RuleVersionInput] }>();

const form = reactive({ ...props.initial });
const reason = ref('');
const errors = ref<Partial<Record<keyof RuleVersionFields, string>>>({});

const FIELDS: { key: keyof RuleVersionFields; label: string; step: string }[] = [
  { key: 'rtp', label: 'RTP (доля)', step: '0.000001' },
  { key: 'minBet', label: 'Минимальная ставка', step: '1' },
  { key: 'betStep', label: 'Шаг ставки', step: '1' },
  { key: 'startBalance', label: 'Стартовый баланс', step: '1' },
  { key: 'dailyTarget', label: 'Ежедневно до', step: '1' },
];

function submit() {
  const fields = Object.fromEntries(FIELDS.map(({ key }) => [key, Number(form[key])])) as unknown as RuleVersionFields;
  errors.value = ruleInputErrors(fields);
  if (Object.keys(errors.value).length) return;
  emit('submit', { ...fields, ...(reason.value.trim() ? { reason: reason.value.trim() } : {}) });
}
</script>

<template>
  <form class="rule-form" novalidate @submit.prevent="submit">
    <label v-for="f in FIELDS" :key="f.key" class="field" :class="{ err: errors[f.key] }">
      <span>{{ f.label }}</span>
      <input v-model="form[f.key]" :name="f.key" type="number" :step="f.step" inputmode="decimal" class="mono" />
      <em v-if="errors[f.key]">{{ errors[f.key] }}</em>
    </label>
    <label class="field wide">
      <span>Причина</span>
      <input v-model="reason" name="reason" maxlength="255" placeholder="необязательно" />
    </label>
    <UiButton variant="ink" type="submit">Создать версию</UiButton>
  </form>
</template>

<style scoped>
.rule-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.field.wide {
  grid-column: span 2;
}

.field input {
  height: 42px;
  padding: 0 12px;
  border: 1.5px solid var(--line);
  border-radius: 11px;
  background: var(--paper);
  color: var(--ink);
}

.field input:focus {
  border-color: var(--ink);
  outline: 0;
}

.field.err input {
  border-color: var(--neg);
}

.field em {
  font-style: normal;
  color: var(--neg);
}

@media (width <= 760px) {
  .rule-form {
    grid-template-columns: 1fr;
  }

  .field.wide {
    grid-column: auto;
  }
}
</style>
