<script setup lang="ts">
defineProps<{ stamp: { kind: 'win' | 'loss'; big: string; small: string } | null }>();
</script>

<template>
  <div class="slot">
    <div v-if="stamp" :key="stamp.big + stamp.small" class="stamp" :class="stamp.kind">
      <b class="mono">{{ stamp.big }}</b>
      <small>{{ stamp.small }}</small>
    </div>
  </div>
</template>

<style scoped>
.slot {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 26px 10px;
  border-radius: 16px;
  border: 3px solid currentcolor;
  background: #1b1914eb;
  backdrop-filter: blur(2px);
  transform: rotate(-6deg);
  animation: stamp 0.5s var(--spring) both;
  transition: opacity 0.25s;
}

:global(.arena:hover) .stamp {
  opacity: 0.1;
}

b {
  font: 700 clamp(30px, 5vw, 48px) / 1 var(--font-mono);
  letter-spacing: -0.05em;
}

small {
  margin-top: 6px;
  font: 600 11.5px var(--font-mono);
  text-transform: uppercase;
  opacity: 0.85;
}

.win {
  color: var(--coin);
}

.loss {
  color: var(--mine);
}

@keyframes stamp {
  0% {
    opacity: 0;
    transform: rotate(-6deg) scale(2.2);
  }

  55% {
    opacity: 1;
  }
}
</style>
