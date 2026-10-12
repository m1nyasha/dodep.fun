<script setup lang="ts">
const props = defineProps<{ mode: 'play' | 'wait' | 'cash' | 'broke'; amount: number; pop: number }>();
const emit = defineEmits<{ press: [] }>();

const LABELS = { play: 'Играть', wait: 'Открой клетку', cash: 'Забрать', broke: 'Нет монет' } as const;
const shown = useCountUp(() => props.amount, { duration: 450 });
const popping = useReplay(350);
watch(() => props.pop, popping.play);
</script>

<template>
  <button
    type="button"
    class="cta"
    :class="{ 'is-wait': mode === 'wait' || mode === 'broke', 'is-cash': mode === 'cash', pop: popping.on.value }"
    :disabled="mode === 'wait' || mode === 'broke'"
    data-hotkey="space"
    @click="emit('press')"
  >
    <span class="label">{{ LABELS[mode] }}</span>
    <span class="sub"
      ><span class="mono">{{ fmt(shown) }}</span
      ><UiCoin
    /></span>
    <kbd>Space</kbd>
  </button>
</template>

<style scoped>
.cta {
  position: relative;
  flex: 0 0 196px;
  min-height: 82px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 15px;
  background: var(--key);
  color: var(--ink);
  box-shadow: 0 5px 0 var(--key-d);
  transform: translateY(-3px);
  transition:
    transform 0.1s,
    box-shadow 0.1s,
    background 0.25s,
    color 0.25s,
    filter 0.2s;
}

.cta:hover:not(:disabled) {
  filter: brightness(1.05);
}

.cta:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--key-d);
}

.label {
  font: 700 17px var(--font-display);
  letter-spacing: -0.03em;
}

.sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14.5px;
  font-weight: 600;
}

.sub :deep(.ui-coin) {
  box-shadow: 0 0 0 0.08em currentcolor;
}

kbd {
  position: absolute;
  top: 7px;
  right: 8px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #2a201014;
  font: 600 9.5px var(--font-mono);
  opacity: 0.6;
}

.is-wait {
  background: var(--c-3);
  color: var(--c-muted);
  box-shadow: 0 5px 0 #14120e;
}

.is-wait kbd,
.is-wait :deep(.ui-coin) {
  opacity: 0.5;
}

.is-cash {
  background: var(--coin);
  box-shadow: 0 5px 0 var(--coin-d);
  animation: glow 1.6s ease-in-out infinite;
}

.is-cash:active {
  box-shadow: 0 0 0 var(--coin-d);
}

.is-cash.pop {
  animation:
    cta-pop 0.35s var(--spring),
    glow 1.6s 0.35s ease-in-out infinite;
}

@keyframes glow {
  50% {
    box-shadow:
      0 5px 0 var(--coin-d),
      0 0 0 7px #ffc6292e;
  }
}

@keyframes cta-pop {
  40% {
    transform: translateY(-3px) scale(1.05);
  }
}

@media (width <= 760px) {
  .cta {
    flex: 1;
    min-height: 64px;
  }

  kbd {
    display: none;
  }
}
</style>
