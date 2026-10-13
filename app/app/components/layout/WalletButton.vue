<script setup lang="ts">
const { me } = useMe();
const daily = useDaily();
const reduced = useReducedMotion();
const open = useState('wallet-open', () => false);
const root = useTemplateRef<HTMLElement>('root');
const balance = computed(() => me.value?.balance ?? me.value?.dailyTarget ?? 10_000);
const shown = useCountUp(balance, { duration: 700 });
const bump = useReplay(500);
const delta = ref<{ id: number; value: number } | null>(null);

watch(balance, (value, old) => {
  if (value === old) return;
  bump.play();
  if (reduced.value) return;
  const id = Date.now();
  delta.value = { id, value: value - old };
  setTimeout(() => {
    if (delta.value?.id === id) delta.value = null;
  }, 1_200);
});

onClickOutside(root, () => (open.value = false));
onKeyStroke('Escape', () => (open.value = false));
</script>

<template>
  <div ref="root" class="wrap">
    <button
      id="wallet"
      type="button"
      class="wallet"
      :class="{ bump: bump.on.value }"
      aria-haspopup="dialog"
      :aria-expanded="open"
      title="Баланс"
      @click="open = !open"
    >
      <UiCoin />
      <span>{{ fmtCompact(shown) }}</span>
      <i v-if="daily.available.value" class="dot" />
    </button>
    <span v-if="delta" :key="delta.id" class="delta mono" :class="delta.value > 0 ? 'pos' : 'neg'">{{
      signed(delta.value)
    }}</span>
    <LayoutWalletPopover v-if="open" />
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
}

.wallet {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 14px 0 12px;
  border-radius: 11px;
  background: var(--ink);
  color: var(--c-text);
  font: 600 15px var(--font-mono);
  letter-spacing: -0.03em;
  transition: transform 0.15s;
}

.wallet:hover {
  transform: translateY(-1px);
}

.wallet:active {
  transform: translateY(1px);
}

.wallet :deep(.ui-coin) {
  font-size: 17px;
  box-shadow: none;
}

.wallet span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: min(140px, 22vw);
}

@media (width <= 760px) {
  .wallet {
    gap: 6px;
    padding: 0 10px 0 9px;
    font-size: 13px;
  }

  .wallet :deep(.ui-coin) {
    font-size: 15px;
  }

  .wallet span {
    max-width: 64px;
  }
}

.bump {
  animation: bump 0.5s var(--spring);
}

.dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--mine);
  border: 2px solid var(--paper);
  color: var(--mine);
  animation: ping 1.8s infinite;
}

.delta {
  position: absolute;
  right: 10px;
  top: 100%;
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
  animation: delta 1.2s var(--out) forwards;
}

@keyframes bump {
  40% {
    transform: scale(1.08);
  }
}

@keyframes delta {
  0% {
    opacity: 0;
    transform: translateY(-4px);
  }

  15% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(16px);
  }
}
</style>
