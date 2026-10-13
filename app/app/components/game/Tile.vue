<script setup lang="ts">
import type { TileView } from '~/utils/board-view';

const props = defineProps<{ index: number; view: TileView; live: boolean; wave: boolean }>();
const emit = defineEmits<{ open: [el: HTMLElement] }>();

const el = useTemplateRef<HTMLButtonElement>('el');
const STATE_TEXT: Record<TileView['state'], string> = {
  closed: 'закрыта',
  flip: 'открывается',
  safe: 'безопасно',
  mine: 'мина',
  ghost: 'мина',
  dim: 'безопасная, не открыта',
};
const label = computed(() => `Клетка ${props.index + 1}, ${STATE_TEXT[props.view.state]}`);
</script>

<template>
  <button
    ref="el"
    type="button"
    class="tile"
    :class="[view.state, { open: view.state !== 'closed', hit: view.hit, wave: wave && view.state === 'closed' }]"
    :style="{ '--r': Math.floor(index / 5), '--c': index % 5, '--d': `${view.delay}ms` }"
    :data-cell="index"
    :aria-label="label"
    @click="emit('open', el!)"
  >
    <span v-if="view.state === 'safe'" class="mono">{{ view.label }}</span>
    <UiIcon v-else-if="view.state === 'mine' || view.state === 'ghost'" name="mine" />
  </button>
</template>

<style scoped>
.tile {
  --edge: var(--key-d);
  --ring: 0 0 #0000;

  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 13px;
  background: var(--key);
  color: var(--ink);
  box-shadow:
    0 6px 0 var(--edge),
    0 8px 12px #0008,
    var(--ring);
  transform: translateY(-3px);
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease,
    background 0.2s;
}

.tile::before {
  content: '';
  width: 18%;
  aspect-ratio: 1;
  border-radius: 30%;
  background: #2a20100f;
  box-shadow: inset 0 1px 1px #2a20101f;
  transition: opacity 0.15s;
}

.live .tile:not(.open):hover {
  transform: translateY(-6px);
  background: #fff7e4;
  box-shadow:
    0 9px 0 var(--key-d),
    0 14px 18px #0009;
}

.live .tile:not(.open):hover::before {
  opacity: 0;
}

.live .tile:not(.open):hover::after {
  content: var(--next);
  position: absolute;
  font: 600 clamp(10px, 1.3vw, 13px) var(--font-mono);
  color: #8a8068;
}

.tile:not(.open):active {
  transform: translateY(3px);
  box-shadow:
    0 0 0 var(--key-d),
    0 1px 2px #0008;
  transition-duration: 0.05s;
}

.open {
  cursor: default;
}

.open::before {
  display: none;
}

.flip {
  animation: flip-out 0.13s ease-in forwards;
}

.safe {
  --edge: var(--coin-d);
  --ring: 0 0 24px #ffc62933;

  background: var(--coin);
  animation: flip-in 0.4s var(--spring);
}

.safe span {
  font: 700 clamp(10px, 1.5vw, 14px) var(--font-mono);
  letter-spacing: -0.05em;
}

.mine {
  --edge: var(--mine-d);

  background: var(--mine);
  animation: boom 0.5s var(--spring);
}

.tile :deep(.ui-icon) {
  width: 48%;
  height: 48%;
  stroke-width: 2;
}

.hit {
  z-index: 1;
  box-shadow:
    0 0 0 3px #11100c,
    0 0 0 5px var(--mine),
    0 0 40px #ff5233aa;
}

.ghost {
  --ring: inset 0 0 0 1.5px #ff523355;

  background: #2e211b;
  color: var(--mine);
  animation: ghost-in 0.4s var(--d, 0ms) both;
}

.dim {
  background: #26231d;
  box-shadow: none;
  transform: none;
  animation: dim-in 0.5s both;
}

.wave {
  animation: wave 0.6s calc((var(--r) + var(--c)) * 38ms) var(--spring) both;
}

@keyframes flip-out {
  to {
    transform: translateY(0) rotateX(90deg) scale(0.92);
  }
}

@keyframes flip-in {
  0% {
    transform: translateY(2px) rotateX(-90deg) scale(0.9);
  }

  60% {
    transform: translateY(2px) rotateX(12deg) scale(1.06);
  }
}

@keyframes boom {
  0% {
    transform: rotateX(-90deg) scale(0.8);
  }

  50% {
    transform: scale(1.18);
  }
}

@keyframes ghost-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes dim-in {
  from {
    background: var(--key);
  }
}

@keyframes wave {
  45% {
    transform: translateY(-11px);
    background: #fff9ea;
  }
}

@media (width <= 760px) {
  .tile {
    border-radius: 9px;
    box-shadow:
      0 4px 0 var(--edge),
      0 6px 8px #0007,
      var(--ring);
  }

  .live .tile:not(.open):hover::after {
    display: none;
  }
}
</style>
