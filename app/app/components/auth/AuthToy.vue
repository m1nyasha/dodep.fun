<script setup lang="ts">
const reduced = useReducedMotion();
const cells = ref<('' | 's' | 'm')[]>(Array.from({ length: 25 }, () => ''));
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (reduced.value) return;
  timer = setInterval(() => {
    const i = Math.floor(Math.random() * cells.value.length);
    if (cells.value[i]) return;
    cells.value[i] = Math.random() < 0.2 ? 'm' : 's';
    setTimeout(() => (cells.value[i] = ''), 1_400 + Math.random() * 1_200);
  }, 380);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="toy" aria-hidden="true">
    <i v-for="(c, i) in cells" :key="i" :class="c" />
  </div>
</template>

<style scoped>
.toy {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 9px;
  max-width: 300px;
}

i {
  aspect-ratio: 1;
  border-radius: 10px;
  background: var(--key);
  box-shadow: 0 5px 0 var(--key-d);
  transform: translateY(-2px);
  transition:
    background 0.3s,
    box-shadow 0.3s,
    transform 0.35s var(--spring);
}

.s {
  background: var(--coin);
  box-shadow: 0 1px 0 var(--coin-d);
  transform: translateY(2px);
}

.m {
  background: var(--mine);
  box-shadow: 0 1px 0 var(--mine-d);
  transform: translateY(2px);
}

@media (width <= 760px) {
  .toy {
    width: 120px;
    gap: 4px;
    flex: none;
  }

  i {
    border-radius: 4px;
    box-shadow: 0 2px 0 var(--key-d);
  }
}
</style>
