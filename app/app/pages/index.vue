<script setup lang="ts">
const { load } = useRules();
await callOnce('rules', load);
useHead({ title: 'dodep.fun — открой клетку, остановись вовремя' });
</script>

<template>
  <div class="game">
    <GameConsole />
    <aside class="side">
      <GameRecentRounds />
    </aside>
  </div>
</template>

<style scoped>
.game {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 88px;
}

@media (width <= 1100px) {
  .game {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (width <= 760px) {
  .side {
    grid-template-columns: 1fr;
  }
}
</style>
