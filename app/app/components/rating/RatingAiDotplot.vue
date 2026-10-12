<script setup lang="ts">
import type { LeaderboardDto } from '@dodep/shared';

const api = useApi();
const { rules, load: loadRules } = useRules();
await useAsyncData('rules', loadRules);
const { data } = await useAsyncData('ai-players', () =>
  api<LeaderboardDto>('/leaderboard', { query: { filter: 'ai', limit: 100 } }),
);

const players = computed(() => data.value?.items ?? []);
const rows = computed(() => groupByType(players.value));
const max = computed(() => axisMax(players.value));
const step = computed(() => (max.value > 60_000 ? 50_000 : 10_000));
const ticks = computed(() => Array.from({ length: max.value / step.value + 1 }, (_, i) => i * step.value));
const x = (v: number) => `${(v / max.value) * 100}%`;
const minBet = computed(() => rules.value?.minBet ?? 100);

const plot = useTemplateRef<HTMLElement>('plot');
const shown = useReveal(plot);
</script>

<template>
  <UiPanel class="types">
    <div class="head">
      <div>
        <h2>AI-типажи</h2>
        <p v-if="players.length" class="muted">
          {{ rows.length }} {{ plural(rows.length, 'характер', 'характера', 'характеров') }}, {{ players.length }}
          {{ plural(players.length, 'агент', 'агента', 'агентов') }}. Точка — один агент, черта — медиана.
        </p>
      </div>
    </div>
    <UiEmpty v-if="!players.length">AI-агенты появятся после запуска эксперимента.</UiEmpty>
    <div v-else ref="plot" class="dp" :class="{ in: shown }" :style="{ '--start': x(rules?.startBalance ?? 0) }">
      <div v-for="(r, ri) in rows" :key="r.type" class="row">
        <span class="name">{{ r.type }}</span>
        <div class="track">
          <i class="med" :style="{ '--m': x(r.median) }" />
          <NuxtLink
            v-for="(a, j) in r.players"
            :key="a.nickname"
            :to="playerPath(a.nickname)"
            class="dot"
            :class="{ bust: a.balance < minBet }"
            :style="{ '--x': x(a.balance), '--j': j, '--row': ri, '--y': `${jitter(a.nickname)}px` }"
            :data-tip="`${a.nickname} · ${fmt(a.balance)}`"
            :aria-label="`${a.nickname}: ${fmt(a.balance)} монет`"
          />
        </div>
        <span class="med-v mono">{{ fmt(r.median) }}</span>
      </div>
      <div class="axis" aria-hidden="true">
        <span />
        <div>
          <span v-for="v in ticks" :key="v" :style="{ left: x(v) }">{{ kLabel(v) }}</span>
        </div>
        <span>медиана</span>
      </div>
    </div>
  </UiPanel>
</template>

<style scoped>
.types {
  margin-top: 28px;
}
.head {
  margin-bottom: 14px;
}
h2 {
  font-size: 22px;
}
.head p {
  margin: 6px 0 0;
  font-size: 13.5px;
}
.dp {
  position: relative;
}
.row,
.axis {
  display: grid;
  grid-template-columns: 170px 1fr 74px;
  gap: 16px;
}
.row {
  align-items: center;
  height: 42px;
  border-top: 1px solid var(--line);
  transition: background 0.15s;
}
.row:hover {
  background: var(--paper);
}
.name {
  padding-left: 4px;
  font-weight: 600;
  font-size: 14px;
}
.track {
  position: relative;
  height: 100%;
}
.track::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--start);
  border-left: 1.5px dashed var(--line-2);
}
.dot {
  position: absolute;
  top: calc(50% + var(--y));
  left: var(--start);
  width: 12px;
  height: 12px;
  margin: -6px;
  border-radius: 4px;
  background: var(--ai);
  opacity: 0;
  transition:
    left 1s var(--out) calc(var(--j) * 35ms + var(--row) * 60ms),
    opacity 0.3s calc(var(--row) * 60ms),
    transform 0.2s var(--spring);
}
.in .dot {
  left: var(--x);
  opacity: 0.8;
}
.dot.bust {
  background: var(--mine);
}
.dot:hover,
.dot:focus-visible {
  z-index: 3;
  opacity: 1;
  transform: scale(1.5);
}
.dot::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) scale(0.667);
  transform-origin: bottom;
  padding: 4px 8px;
  border-radius: 7px;
  background: var(--ink);
  color: var(--paper);
  font:
    600 12px 'JetBrains Mono',
    monospace;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.dot:hover::after,
.dot:focus-visible::after {
  opacity: 1;
}
.med {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: var(--m);
  width: 3px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: var(--ink);
  opacity: 0;
  transition: opacity 0.5s 1.1s;
}
.in .med {
  opacity: 1;
}
.med-v {
  text-align: right;
  font-size: 13px;
  font-weight: 600;
}
.axis {
  padding-top: 8px;
  border-top: 1px solid var(--line);
}
.axis div {
  position: relative;
  height: 16px;
}
.axis div span {
  position: absolute;
  transform: translateX(-50%);
  font:
    500 11px 'JetBrains Mono',
    monospace;
  color: var(--muted);
}
.axis > span {
  text-align: right;
  font-size: 11px;
  color: var(--muted);
}
@media (width <= 760px) {
  .row,
  .axis {
    grid-template-columns: 96px 1fr 52px;
    gap: 10px;
  }
  .name {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dot {
    left: var(--x);
    opacity: 0.8;
    transition: none;
  }
  .med {
    opacity: 1;
    transition: none;
  }
}
</style>
