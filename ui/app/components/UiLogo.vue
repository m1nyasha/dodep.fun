<script setup lang="ts">
const cells = [0, 1, 2].flatMap((y) => [0, 1, 2].map((x) => ({ x: x * 5, y: y * 5, hot: x === 2 && y === 0 })));
</script>

<template>
  <span class="logo-mark">
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <rect
        v-for="c in cells"
        :key="`${c.x}-${c.y}`"
        :x="c.x"
        :y="c.y"
        width="4"
        height="4"
        rx="1"
        :class="{ hot: c.hot }"
      />
    </svg>
  </span>
</template>

<style scoped>
svg {
  display: block;
  width: 22px;
  height: 22px;
  fill: var(--ink);
}

.hot {
  fill: var(--mine);
}

.logo-mark:hover .hot,
:global(a:hover) .hot {
  animation: blink 0.7s steps(2) 2;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
