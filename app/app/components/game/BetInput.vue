<script setup lang="ts">
const bet = defineModel<number>({ required: true });
const props = defineProps<{ min: number; step: number; max: number; disabled?: boolean }>();

const sfx = useSfx();
const tick = useReplay(300);
const text = ref(fmt(bet.value));

const CHIPS = [
  ['100', 100],
  ['500', 500],
  ['1к', 1_000],
  ['/2', 'half'],
  ['×2', 'double'],
  ['Макс', 'max'],
] as const;

watch(bet, (v) => (text.value = fmt(v)));
watch(
  () => props.max,
  () => set(bet.value, true),
);

const read = () => Number(text.value.replace(/\D/g, '')) || 0;

function set(value: number, silent = false) {
  const next = clampBet(value, props);
  text.value = fmt(next);
  if (next === bet.value) return;
  bet.value = next;
  if (silent) return;
  tick.play();
  sfx.play('tap');
}

function chip(value: (typeof CHIPS)[number][1]) {
  if (value === 'half') set(bet.value / 2);
  else if (value === 'double') set(bet.value * 2);
  else if (value === 'max') set(props.max);
  else set(value);
}

function onInput(e: Event) {
  text.value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
  const input = e.target as HTMLInputElement;
  const start = input.selectionStart ?? text.value.length;
  const end = input.selectionEnd ?? text.value.length;
  text.value = (text.value.slice(0, start) + pasted + text.value.slice(end)).replace(/\D/g, '');
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    set(read() + (e.key === 'ArrowUp' ? props.step : -props.step));
  } else if (e.key === 'Enter') {
    (e.target as HTMLInputElement).blur();
  }
}

function onWheel(e: WheelEvent) {
  if (document.activeElement !== e.target) return;
  e.preventDefault();
  set(read() + (e.deltaY < 0 ? props.step : -props.step));
}
</script>

<template>
  <div class="bet" :class="{ locked: disabled }">
    <div class="field">
      <button type="button" aria-label="Уменьшить ставку" :disabled="disabled" @click="set(bet - step)">−</button>
      <label>
        <UiCoin />
        <input
          :value="text"
          inputmode="numeric"
          autocomplete="off"
          aria-label="Ставка"
          :class="{ tick: tick.on.value }"
          :disabled="disabled"
          @input="onInput"
          @paste="onPaste"
          @blur="set(read())"
          @keydown="onKey"
          @wheel="onWheel"
        />
      </label>
      <button type="button" aria-label="Увеличить ставку" :disabled="disabled" @click="set(bet + step)">+</button>
    </div>
    <div class="chips">
      <button
        v-for="[label, value] in CHIPS"
        :key="label"
        type="button"
        :class="{ on: value === bet }"
        :disabled="disabled"
        @click="chip(value)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.bet {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: opacity 0.3s;
}

.locked {
  opacity: 0.35;
}

.field {
  display: flex;
  align-items: center;
  height: 48px;
  border-radius: 13px;
  background: #11100c;
  box-shadow: inset 0 2px 6px #000b;
}

.field > button {
  width: 46px;
  height: 100%;
  border-radius: 13px;
  font-size: 22px;
  color: var(--c-muted);
  transition:
    color 0.15s,
    background 0.15s;
}

.field > button:hover:not(:disabled) {
  color: var(--c-text);
  background: #ffffff0b;
}

label {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: text;
}

label :deep(.ui-coin) {
  font-size: 16px;
  box-shadow: none;
}

input {
  width: 100%;
  max-width: 120px;
  min-width: 0;
  border: 0;
  outline: 0;
  background: none;
  color: var(--c-text);
  font: 600 20px var(--font-mono);
  letter-spacing: -0.04em;
}

input.tick {
  animation: tick 0.3s var(--spring);
}

.chips {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.chips button {
  white-space: nowrap;
  height: 28px;
  border-radius: 8px;
  background: var(--c-2);
  color: var(--c-muted);
  font: 600 12px var(--font-mono);
  transition:
    background 0.15s,
    color 0.15s,
    transform 0.15s var(--spring);
}

.chips button:hover:not(:disabled) {
  background: var(--c-3);
  color: var(--c-text);
}

.chips button:active:not(:disabled) {
  transform: scale(0.92);
}

.chips button.on {
  background: var(--key);
  color: var(--ink);
}

@media (width <= 760px) {
  .bet {
    flex: 1 1 100%;
  }
}
</style>
