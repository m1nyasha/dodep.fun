<script setup lang="ts">
const emit = defineEmits<{ submit: [amount: number] }>();

const value = ref('');
const error = ref('');

function submit() {
  const text = value.value.trim();
  if (!/^-?\d+$/.test(text)) {
    error.value = 'Введите целое число';
    return;
  }
  const amount = Number(text);
  if (amount === 0) {
    error.value = 'Сумма не может быть нулевой';
    return;
  }
  if (Math.abs(amount) > 1_000_000_000) {
    error.value = 'Слишком большая сумма';
    return;
  }
  error.value = '';
  emit('submit', amount);
}

function onResult(success: boolean) {
  if (!success) return;
  value.value = '';
  error.value = '';
}

defineExpose({ onResult });
</script>

<template>
  <form class="coins-form" novalidate @submit.prevent="submit">
    <label class="field" :class="{ err: error }">
      <span>Сумма</span>
      <input v-model="value" name="amount" type="text" inputmode="numeric" placeholder="±количество" class="mono" />
      <em v-if="error">{{ error }}</em>
    </label>
    <UiButton variant="ink" type="submit">Начислить / списать</UiButton>
  </form>
</template>

<style scoped>
.coins-form {
  display: flex;
  gap: 12px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.field input {
  height: 42px;
  padding: 0 12px;
  border: 1.5px solid var(--line);
  border-radius: 11px;
  background: var(--paper);
  color: var(--ink);
  width: 180px;
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
  .coins-form {
    flex-direction: column;
    align-items: stretch;
  }

  .field input {
    width: auto;
  }
}
</style>
