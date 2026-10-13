<script setup lang="ts">
import { CELLS, multiplier, payout, SAFE, safeChance, type RulesDto } from '@dodep/shared';

const props = defineProps<{ rules: RulesDto }>();
const k = defineModel<number>('k', { required: true });
const { play } = useSfx();

const MAX_BET = 1_000_000_000;

// Фиксированный «случайный» порядок из прототипа: поле каждый раз заполняется одинаково.
const REVEAL_ORDER = [12, 6, 18, 7, 13, 1, 22, 16, 8, 3, 11, 19, 23, 0, 14, 9, 21, 4, 17, 2, 10, 24, 5, 15, 20];
const order = Array.from({ length: CELLS }, (_, i) => REVEAL_ORDER.indexOf(i));

const betText = ref(String(props.rules.minBet));
const bet = computed(() => Math.max(props.rules.minBet, Number(betText.value) || props.rules.minBet));
const fill = computed(() => `${((k.value - 1) / (SAFE - 1)) * 100}%`);
const rtpText = computed(() => String(props.rules.rtp).replace('.', ','));

function onRange(e: Event) {
  k.value = Number((e.target as HTMLInputElement).value);
  play('safe', k.value - 1);
}

function onBet(e: Event) {
  const el = e.target as HTMLInputElement;
  const digits = el.value.replace(/\D/g, '');
  betText.value = digits === '' ? '' : String(Math.min(MAX_BET, Number(digits)));
  el.value = betText.value;
}
</script>

<template>
  <UiPanel class="calc">
    <div>
      <h2>Сколько клеток открыть?</h2>
      <div class="k-out">
        <b class="mono">{{ k }}</b>
        <span>{{ plural(k, 'клетка', 'клетки', 'клеток') }} подряд</span>
      </div>
      <input
        type="range"
        min="1"
        :max="SAFE"
        :value="k"
        :style="{ '--fill': fill }"
        aria-label="Число клеток"
        @input="onRange"
      />
      <div class="board" aria-hidden="true">
        <i v-for="(o, i) in order" :key="i" :class="{ s: o < k }" :style="{ '--d': `${o * 18}ms` }" />
      </div>
    </div>
    <div>
      <dl class="kv">
        <div>
          <dt>Шанс не встретить мину</dt>
          <dd class="mono">{{ pct(safeChance(k)) }}</dd>
        </div>
        <div>
          <dt>Множитель</dt>
          <dd class="mono">{{ fx(multiplier(k, rules.rtp)) }}</dd>
        </div>
        <div>
          <dt>
            Выплата со ставки
            <input :value="betText" class="bet mono" inputmode="numeric" aria-label="Ставка" @input="onBet" />
          </dt>
          <dd class="mono" aria-live="polite">{{ fmt(payout(bet, k, rules.rtp)) }}</dd>
        </div>
      </dl>
      <p class="formula">выплата = ставка × {{ rtpText }} ÷ шанс</p>
      <p class="note">
        Поэтому в среднем игра возвращает {{ pct(rules.rtp) }} поставленного — но только на очень длинной дистанции.
        Отдельному раунду или вечеру это ничего не обещает.
      </p>
    </div>
  </UiPanel>
</template>

<style scoped>
.calc {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 32px;
  padding: 26px;
}
.calc > div {
  min-width: 0;
}
h2 {
  font-size: 20px;
}
.k-out {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 18px 0 2px;
}
.k-out b {
  font-size: 46px;
  line-height: 1;
  font-weight: 700;
}
.k-out span {
  color: var(--muted);
}
input[type='range'] {
  appearance: none;
  width: 100%;
  height: 34px;
  margin: 0;
  background: none;
  cursor: pointer;
}
input[type='range']::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--ink) var(--fill), var(--line) var(--fill));
}
input[type='range']::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: var(--line);
}
input[type='range']::-moz-range-progress {
  height: 8px;
  border-radius: 4px;
  background: var(--ink);
}
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 26px;
  height: 26px;
  margin-top: -9px;
  border-radius: 8px;
  background: var(--coin);
  border: 2px solid var(--ink);
  box-shadow: 0 3px 0 var(--ink);
  transition: transform 0.2s var(--spring);
}
input[type='range']::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: var(--coin);
  border: 2px solid var(--ink);
  box-shadow: 0 3px 0 var(--ink);
}
input[type='range']:active::-webkit-slider-thumb {
  transform: scale(1.15);
}
.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
  width: 260px;
  margin-top: 16px;
  padding: 12px 12px 15px;
  border-radius: 18px;
  background: var(--c-bg);
}
.board i {
  aspect-ratio: 1;
  border-radius: 8px;
  background: var(--key);
  box-shadow: 0 4px 0 var(--key-d);
  transform: translateY(-2px);
  transition:
    background 0.2s var(--d),
    box-shadow 0.2s var(--d),
    transform 0.3s var(--d) var(--spring);
}
.board i.s {
  background: var(--coin);
  box-shadow: 0 1px 0 var(--coin-d);
  transform: translateY(1px);
}
.kv {
  margin: 0;
}
.kv div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px dashed var(--line-2);
}
.kv dt {
  color: var(--muted);
  font-size: 14px;
}
.kv dd {
  min-width: 0;
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  overflow-wrap: anywhere;
  text-align: right;
}
.bet {
  width: 72px;
  margin-left: 4px;
  padding: 2px 8px;
  border: 1.5px solid var(--line-2);
  border-radius: 8px;
  background: var(--paper);
  font-size: 14px;
  outline: 0;
}
.bet:focus {
  border-color: var(--ink);
}
.formula {
  margin: 18px 0 10px;
  padding: 12px 14px;
  border-radius: 11px;
  background: var(--paper-2);
  font:
    500 14px 'JetBrains Mono',
    monospace;
}
.note {
  margin: 0;
  color: var(--muted);
  font-size: 13.5px;
}
@media (width <= 760px) {
  .calc {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 16px;
  }
  .board {
    width: 100%;
    max-width: 280px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .board i {
    transition: none;
  }
}
</style>
