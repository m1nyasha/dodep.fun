<script setup lang="ts">
const { items } = useRecentRounds();
const { me } = useMe();
</script>

<template>
  <UiPanel title="Мои раунды">
    <template #actions>
      <b v-if="me && items.length" class="mono net" :class="me.net >= 0 ? 'pos' : 'neg'">{{ signed(me.net) }}</b>
    </template>
    <TransitionGroup tag="ol" name="hist" class="hist">
      <li v-for="r in items" :key="r.id" :class="r.status === 'hit_mine' ? 'lose' : 'win'">
        <i class="dot" />
        <span>
          {{ r.status === 'cashed_out' ? fx(r.multiplier) : 'Мина' }}
          <small
            >{{ r.status === 'cashed_out' ? cellsText(r.safeCount) : `на ${r.safeCount + 1}-й клетке` }} ·
            {{ ago(r.finishedAt) }}</small
          >
        </span>
        <b class="mono" :class="r.net >= 0 ? 'pos' : 'neg'">{{ signed(r.net) }}</b>
      </li>
      <li v-if="!items.length" key="empty" class="empty">Здесь появятся твои раунды.</li>
    </TransitionGroup>
    <NuxtLink class="more" to="/journal">Весь журнал</NuxtLink>
  </UiPanel>
</template>

<style scoped>
.hist {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 11px;
  align-items: center;
  padding: 9px 0;
  border-top: 1px solid var(--line);
}

li:first-child {
  border-top: 0;
}

li.empty {
  display: block;
  padding: 18px 0;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--coin);
  flex: none;
}

.lose .dot {
  background: var(--mine);
}

span {
  font-weight: 600;
  font-size: 14px;
}

small {
  display: block;
  font-weight: 400;
  font-size: 12px;
  color: var(--muted);
}

b {
  font-size: 14px;
}

.more {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 1px solid var(--line-2);
  transition:
    color 0.2s,
    border-color 0.2s;
}

.more:hover {
  color: var(--ink);
  border-color: var(--ink);
}

.hist-enter-active {
  animation: slide-in 0.5s var(--spring);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
}
</style>
