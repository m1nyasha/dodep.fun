<script setup lang="ts">
const g = useGamePlay();
const { rules } = useRules();
const { isAuthed } = useMe();
const recent = useRecentRounds();
const game = useRound();

useHotkeys({ space: g.press, r: g.randomCell });

function keepFocus(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) e.preventDefault();
}

async function sync() {
  if (!isAuthed.value) return;
  await Promise.all([game.restore(), recent.load()]).catch(() => undefined);
}

onMounted(sync);
watch(isAuthed, (authed) => (authed ? sync() : game.reset()));
</script>

<template>
  <section class="console" :class="{ live: g.live.value, shake: g.shake.on.value }" @mousedown="keepFocus">
    <GameLadder v-if="rules" :ladder="rules.ladder" v-bind="g.ladderState.value" />
    <div class="arena">
      <GameBoard :round="g.round.value" :flipping="g.flipping.value" :next-label="g.nextLabel.value" @open="g.open" />
      <GameStamp :stamp="g.stamp.value" />
    </div>
    <GameReadout v-bind="g.readout.value" />
    <div class="controls">
      <GameBetInput
        v-model="g.bet.value"
        :min="g.minBet.value"
        :step="g.step.value"
        :max="g.maxBet.value"
        :disabled="g.live.value"
      />
      <button
        v-if="g.live.value"
        type="button"
        class="dice"
        title="Случайная клетка · R"
        aria-label="Открыть случайную клетку"
        @click="g.randomCell"
      >
        <UiIcon name="dice" />
      </button>
      <GameCta
        id="cta"
        :class="{ nudge: g.nudge.on.value }"
        :mode="g.ctaMode.value"
        :amount="g.ctaAmount.value"
        :pop="g.pop.value"
        @press="g.press"
      />
    </div>
    <GameSeal :round="g.round.value" :broke="g.broke.value" />
    <p class="sr-only" aria-live="polite">{{ g.announce.value }}</p>
  </section>
</template>

<style scoped>
.console {
  --w: clamp(480px, calc(100vh - 430px), 540px);

  position: relative;
  overflow: hidden;
  padding: 20px 22px 16px;
  border-radius: 30px;
  background: var(--c-bg);
  color: var(--c-text);
  box-shadow:
    inset 0 1px 0 #ffffff14,
    0 2px 0 #000,
    0 40px 70px -35px #2a1d0699;
}

.console::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  box-shadow: inset 0 0 90px 10px #ff523366;
}

.shake {
  animation: shake 0.45s;
}

.shake::after {
  animation: flash 0.7s ease-out;
}

.arena {
  position: relative;
  max-width: var(--w);
  margin: 4px auto 0;
}

.controls {
  /* Fixed cap (matches --w's own max), not tied to viewport height: the row must fit
     its own content (bet field + optional dice + CTA) regardless of how tall the
     screen is. GameBetInput's min-width + flex-wrap here let it drop to its own
     line instead of being squeezed when space is tight (e.g. the dice button
     appearing mid-round). */
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 540px;
  margin: 10px auto 0;
}

.dice {
  width: 60px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: var(--c-2);
  color: var(--c-text);
  transition: background 0.2s;
  animation: pop 0.3s var(--spring);
}

.dice:hover {
  background: var(--c-3);
}

.dice :deep(.ui-icon) {
  width: 26px;
  height: 26px;
  transition: transform 0.45s var(--spring);
}

.dice:hover :deep(.ui-icon) {
  transform: rotate(90deg);
}

@keyframes shake {
  15% {
    transform: translate(-7px, 2px) rotate(-0.4deg);
  }

  30% {
    transform: translate(6px, -2px) rotate(0.4deg);
  }

  45% {
    transform: translate(-5px, 1px);
  }

  60% {
    transform: translate(4px, 0);
  }

  80% {
    transform: translate(-2px, 0);
  }
}

@keyframes flash {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@media (width <= 760px) {
  .console {
    margin: 0 -6px;
    padding: 14px 12px 12px;
    border-radius: 24px;
  }

  .dice {
    width: 64px;
  }
}
</style>
