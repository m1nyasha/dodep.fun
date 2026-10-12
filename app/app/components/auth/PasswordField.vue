<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{ error?: string; meter?: boolean; autocomplete: string }>();

const visible = ref(false);
const strength = computed(() => passwordStrength(model.value));
</script>

<template>
  <label class="field" :class="{ err: error }" data-field="password">
    <span>Пароль</span>
    <div class="pw">
      <input
        v-model="model"
        name="password"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        placeholder="не меньше 8 символов"
      />
      <button
        type="button"
        class="eye"
        :class="{ on: visible }"
        :aria-label="visible ? 'Скрыть пароль' : 'Показать пароль'"
        @click="visible = !visible"
      >
        <UiIcon :name="visible ? 'eyeOff' : 'eye'" />
      </button>
    </div>
    <div v-if="meter" class="meter" :data-s="strength"><i /><i /><i /><i /></div>
    <em class="field-msg">{{ error }}</em>
  </label>
</template>

<style scoped>
.field {
  display: block;
  margin-top: 16px;
}

.field > span {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

.pw {
  position: relative;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 48px 0 14px;
  border-radius: 13px;
  border: 1.5px solid var(--line-2);
  background: var(--paper);
  outline: 0;
  font-size: 15px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

input:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 4px #18160f10;
}

.err input {
  border-color: var(--mine);
}

.eye {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--muted);
  transition:
    background 0.15s,
    color 0.15s;
}

.eye:hover,
.eye.on {
  color: var(--ink);
  background: var(--paper-2);
}

.meter {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 8px;
}

.meter i {
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  transition: background 0.3s;
}

.meter[data-s='1'] i:nth-child(-n + 1) {
  background: var(--mine);
}

.meter[data-s='2'] i:nth-child(-n + 2) {
  background: #f08a24;
}

.meter[data-s='3'] i:nth-child(-n + 3) {
  background: var(--coin-d);
}

.meter[data-s='4'] i {
  background: var(--pos);
}

.field-msg {
  display: block;
  font-style: normal;
  font-size: 12.5px;
  color: var(--neg);
}

.field-msg:not(:empty) {
  margin-top: 5px;
  animation: rise 0.25s var(--out);
}
</style>
