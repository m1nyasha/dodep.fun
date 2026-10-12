<script setup lang="ts">
defineProps<{ minBet: number; betStep: number }>();
</script>

<template>
  <section class="steps">
    <UiPanel as="article" class="step">
      <div class="art">
        <div class="art-bet">
          <span>−</span><b class="mono">{{ fmt(minBet) }}</b
          ><UiCoin /><span>+</span>
        </div>
      </div>
      <h3><span class="mono">1</span>Ставка</h3>
      <p>От {{ fmt(minBet) }} монет с шагом {{ fmt(betStep) }}. Списывается в начале раунда.</p>
    </UiPanel>
    <UiPanel as="article" class="step">
      <div class="art">
        <JournalMiniBoard />
        <span class="art-lock"><UiIcon name="lock" /></span>
      </div>
      <h3><span class="mono">2</span>Клетки</h3>
      <p>Мины расставлены до первого хода и не двигаются до конца раунда.</p>
    </UiPanel>
    <UiPanel as="article" class="step">
      <div class="art">
        <div class="art-choice"><span class="a">Ещё</span><span class="b">Забрать</span></div>
      </div>
      <h3><span class="mono">3</span>Решение</h3>
      <p>После каждой безопасной клетки можно забрать выплату. Мина — ставка сгорает.</p>
    </UiPanel>
  </section>
</template>

<style scoped>
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.step {
  padding: 14px 14px 20px;
}
.art {
  position: relative;
  height: 130px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 14px;
  background: var(--c-bg);
  color: var(--c-text);
  overflow: hidden;
}
h3 {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 6px;
  font-size: 18px;
}
h3 .mono {
  font-size: 13px;
  color: var(--muted);
}
p {
  margin: 8px 0 0;
  padding: 0 6px;
  font-size: 14.5px;
  color: var(--muted);
}
.art-bet {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-radius: 13px;
  background: color-mix(in srgb, var(--c-bg) 70%, black);
  color: var(--c-muted);
  font-size: 20px;
}
.art-bet b {
  color: var(--c-text);
  font-size: 22px;
}
.art-lock {
  position: absolute;
  right: calc(50% - 64px);
  bottom: 18px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--coin);
  color: var(--ink);
  transition: transform 0.4s var(--spring);
}
.step:hover .art-lock {
  transform: rotate(-12deg) scale(1.1);
}
.art-choice {
  display: flex;
  gap: 10px;
}
.art-choice span {
  padding: 12px 18px;
  border-radius: 12px;
  font:
    700 14px Unbounded,
    sans-serif;
  transition: transform 0.3s var(--spring);
}
.art-choice .a {
  background: var(--c-3);
  color: var(--c-muted);
}
.art-choice .b {
  background: var(--coin);
  color: var(--ink);
  box-shadow: 0 4px 0 var(--coin-d);
}
.step:hover .art-choice .b {
  transform: translateY(-4px);
}
@media (width <= 760px) {
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>
