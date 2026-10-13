<script setup lang="ts">
import type { FinishedRoundDto } from '@dodep/shared';

const props = defineProps<{ round: FinishedRoundDto; flash?: boolean }>();
const open = defineModel<boolean>('open', { default: false });
const { play } = useSfx();
const verdict = ref<boolean | null>(null);
const checking = ref(false);
const win = computed(() => props.round.status === 'cashed_out');

async function verify() {
  checking.value = true;
  try {
    verdict.value = await verifyRound(props.round.mines, props.round.salt, props.round.hash);
    play(verdict.value ? 'win' : 'lose');
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <details
    :id="round.id"
    class="row"
    :class="{ flash }"
    :open="open"
    @toggle="open = ($event.target as HTMLDetailsElement).open"
  >
    <summary>
      <i class="h-dot" :class="win ? 'win' : 'lose'" />
      <span>
        <b class="mono">№{{ round.roundNo }}</b>
        <small>{{ stamp(round.finishedAt) }}</small>
      </span>
      <span class="mono">{{ fmt(round.bet) }}</span>
      <span class="mono">{{ round.safeCount }}</span>
      <span class="mono">{{ fmt(round.payout) }}</span>
      <span class="mono" :class="round.net >= 0 ? 'pos' : 'neg'">{{ signed(round.net) }}</span>
      <UiIcon name="chev" class="chev" />
    </summary>
    <div v-if="open" class="body">
      <JournalMiniBoard size="md" :mines="round.mines" :picks="round.opened" :hit="round.hitCell" />
      <div class="data">
        <dl class="verify">
          <div>
            <dt>Мины</dt>
            <dd class="mono">{{ minesLabel(round.mines) }}</dd>
          </div>
          <div>
            <dt>Соль</dt>
            <dd class="mono">{{ round.salt }}</dd>
          </div>
          <div>
            <dt>SHA-256 до первого хода</dt>
            <dd class="mono hash">{{ round.hash }}</dd>
          </div>
          <div>
            <dt>Правила</dt>
            <dd class="mono">v{{ round.ruleVersion }} · RTP {{ pct(round.rtp) }}</dd>
          </div>
        </dl>
        <div class="act" role="status">
          <span v-if="verdict !== null" class="verdict" :class="verdict ? 'pos' : 'neg'">
            <UiIcon v-if="verdict" name="check" />
            {{ verdict ? 'Совпадает с хэшем, показанным до первого хода' : 'Не совпадает' }}
          </span>
          <UiButton v-else size="sm" :loading="checking" @click="verify"><UiIcon name="check" />Проверить</UiButton>
        </div>
      </div>
    </div>
  </details>
</template>

<style scoped>
.row {
  border-top: 1px solid var(--line);
}
summary {
  display: grid;
  grid-template-columns: 14px 1.6fr 1fr 0.7fr 1fr 1fr 24px;
  gap: 14px;
  align-items: center;
  padding: 12px 6px;
  cursor: pointer;
  list-style: none;
  font-size: 14px;
  border-radius: 10px;
  transition: background 0.15s;
}
summary::-webkit-details-marker {
  display: none;
}
summary:hover {
  background: var(--paper);
}
summary small {
  display: block;
  font-size: 12px;
  color: var(--muted);
}
.h-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--coin);
}
.h-dot.lose {
  background: var(--mine);
}
.chev {
  color: var(--muted);
  transition: transform 0.3s var(--spring);
}
.row[open] .chev {
  transform: rotate(180deg);
}
.flash summary {
  animation: flash-row 1.6s 0.4s;
}
.body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px 24px;
  align-items: start;
  padding: 8px 6px 20px 34px;
}
.data {
  /* ponytail: verify + act live in one flex column so the button sits right under the data it belongs to,
     instead of being a separate .body grid row that trails below the (taller) board image. */
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.verify {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
  margin: 0;
}
dt {
  font-size: 12px;
  color: var(--muted);
}
dd {
  margin: 2px 0 0;
  font-size: 13px;
}
.hash {
  word-break: break-all;
}
.act {
  display: flex;
  justify-content: flex-end;
}
.verdict {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}
@keyframes flash-row {
  0%,
  100% {
    background: transparent;
  }
  30% {
    background: color-mix(in srgb, var(--coin) 45%, transparent);
  }
}
@media (width <= 760px) {
  summary {
    grid-template-columns: 12px 1fr auto 20px;
  }
  summary > span:nth-of-type(2),
  summary > span:nth-of-type(3),
  summary > span:nth-of-type(4) {
    display: none;
  }
  .body {
    grid-template-columns: 1fr;
    padding-left: 6px;
  }
  .verify {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .flash summary {
    animation: none;
    background: color-mix(in srgb, var(--coin) 25%, transparent);
  }
}
</style>
