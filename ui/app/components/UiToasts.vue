<script setup lang="ts">
const { toasts } = useToast();
</script>

<template>
  <TransitionGroup tag="div" name="toast" class="toasts" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.tone">
      <b>{{ t.title }}</b>
      <span v-if="t.detail">{{ t.detail }}</span>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.toasts {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 95;
  display: grid;
  gap: 8px;
  width: min(380px, calc(100vw - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  padding: 12px 16px;
  border-radius: 15px;
  background: var(--ink);
  color: var(--paper);
  box-shadow: 0 18px 36px -14px #000a;
}

.toast b {
  display: block;
  font-size: 14px;
}

.toast span {
  display: block;
  margin-top: 1px;
  font-size: 13px;
  opacity: 0.72;
}

.toast.good {
  box-shadow:
    inset 4px 0 0 var(--coin),
    0 18px 36px -14px #000a;
}

.toast.bad {
  box-shadow:
    inset 4px 0 0 var(--mine),
    0 18px 36px -14px #000a;
}

.toast-enter-active {
  animation: toast-in 0.4s var(--spring);
}

.toast-leave-active {
  animation: toast-out 0.26s forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }
}

@keyframes toast-out {
  to {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}

@media (width <= 760px) {
  .toasts {
    bottom: 96px;
  }
}
</style>
