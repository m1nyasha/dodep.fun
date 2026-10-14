<script setup lang="ts">
import type { PlayerDto } from '@dodep/shared';

const { me } = useMe();
const { play } = useSfx();
const filter = ref('all');
const query = ref('');
const lb = useLeaderboard(filter, query);
await useAsyncData('leaderboard:first', () => lb.load(true).then(() => true));

const filters = [
  { value: 'all', label: 'Все' },
  { value: 'human', label: 'Люди' },
  { value: 'ai', label: 'AI' },
];
watch(filter, () => play('tap'));

const meName = computed(() => me.value?.nickname ?? null);
const rowClass = (p: PlayerDto) => ({
  'is-top': p.rank <= 5,
  'is-top3': p.rank <= 3,
  'is-me': playerKind(p, meName.value) === 'me',
});
</script>

<template>
  <UiPanel class="lb-panel">
    <div class="tbar">
      <UiSeg v-model="filter" :options="filters" />
      <UiSearch v-model="query" placeholder="Найти игрока" />
    </div>
    <div class="tscroll">
      <table class="lb" :aria-busy="lb.pending.value">
        <thead>
          <tr>
            <th>#</th>
            <th>Игрок</th>
            <th class="r">Баланс</th>
            <th class="r">Итог ставок</th>
            <th class="r">Раунды</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(p, i) in lb.items.value"
            :key="p.nickname"
            :class="rowClass(p)"
            :style="{ '--i': i }"
            @click="navigateTo(playerPath(p.nickname))"
          >
            <td class="rk mono">{{ p.rank }}</td>
            <td>
              <div class="who">
                <UiAvatar :name="p.nickname" :kind="playerKind(p, meName)" :size="34" />
                <div>
                  <NuxtLink :to="playerPath(p.nickname)" @click.stop>{{ p.nickname }}</NuxtLink>
                  <UiTag v-if="p.isAi" tone="ai">AI</UiTag>
                  <UiTag v-if="playerKind(p, meName) === 'me'" tone="me">ты</UiTag>
                  <UiTag v-if="p.rank <= 5" tone="top">топ-{{ p.rank }}</UiTag>
                  <small v-if="p.status">«{{ p.status }}»</small>
                  <small v-else-if="p.isAi && p.aiType">{{ p.aiType }}</small>
                </div>
              </div>
            </td>
            <td class="r mono">{{ fmt(p.balance) }}</td>
            <td class="r mono" :class="p.net >= 0 ? 'pos' : 'neg'">{{ signed(p.net) }}</td>
            <td class="r mono">{{ fmt(p.roundsCount) }}</td>
          </tr>
          <tr v-if="!lb.items.value.length" class="none">
            <td colspan="5"><UiEmpty>Никого не нашли.</UiEmpty></td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiButton
      v-if="lb.more.value"
      variant="line"
      size="sm"
      class="more"
      :loading="lb.pending.value"
      @click="lb.loadMore()"
    >
      Показать ещё · {{ lb.more.value }}
    </UiButton>
    <p class="tnote">
      Итог ставок — выплаты минус ставки; ежедневные монеты в него не входят. Пятеро лучших игроков получают отметку —
      люди и AI-агенты участвуют в общем рейтинге по балансу.
    </p>
  </UiPanel>
</template>

<style scoped>
.lb-panel {
  padding-bottom: 16px;
}
.tbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.tscroll {
  overflow-x: auto;
  margin: 0 -20px;
}
.lb {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
}
th {
  padding: 10px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-align: left;
}
.r {
  text-align: right;
}
td {
  padding: 10px 20px;
  border-top: 1px solid var(--line);
  font-size: 14.5px;
  vertical-align: middle;
}
tbody tr {
  cursor: pointer;
  transition: background 0.15s;
  animation: row-in 0.4s var(--out) both;
  animation-delay: calc(min(var(--i), 20) * 18ms);
}
tbody tr:hover {
  background: var(--paper);
}
tr.none {
  cursor: default;
}
tr.is-top td:first-child {
  box-shadow: inset 3px 0 0 var(--coin);
}
tr.is-top3 {
  background: color-mix(in srgb, var(--coin) 18%, var(--card));
}
tr.is-top3:hover {
  background: color-mix(in srgb, var(--coin) 28%, var(--card));
}
tr.is-me td:first-child {
  box-shadow: inset 3px 0 0 var(--ink);
}
tr.is-me {
  background: color-mix(in srgb, var(--ink) 3%, transparent);
}
.who {
  display: flex;
  align-items: center;
  gap: 12px;
}
.who > div {
  min-width: 0;
}
.who a {
  font-weight: 600;
  margin-right: 4px;
}
.who a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.who small {
  display: block;
  max-width: 360px;
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.more {
  display: flex;
  margin: 14px auto 0;
}
.tnote {
  font-size: 13px;
  color: var(--muted);
  margin: 14px 0 0;
  max-width: 760px;
}
@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
@media (prefers-reduced-motion: reduce) {
  tbody tr {
    animation: none;
  }
}
</style>
