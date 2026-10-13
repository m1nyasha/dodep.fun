<script setup lang="ts">
const props = defineProps<{ points: number[] }>();
const W = 800;
const H = 180;
const gradientId = useId();
const geo = computed(() => sparkGeometry(props.points, W, H));
const tone = computed(() => ((props.points.at(-1) ?? 0) >= 0 ? 'pos' : 'neg'));
const hover = ref<number | null>(null);

function onMove(e: PointerEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  if (!r.width) return;
  hover.value = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (props.points.length - 1));
}

const marker = computed(() => {
  const i = hover.value;
  if (i === null) return null;
  const v = props.points[i]!;
  return {
    style: { left: `${(geo.value.x(i) / W) * 100}%`, top: `${(geo.value.y(v) / H) * 100}%` },
    text: i ? `после ${i}-го: ${signed(v)}` : 'старт: 0',
  };
});
</script>

<template>
  <div class="spark" :class="tone" @pointermove="onMove" @pointerleave="hover = null">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="currentcolor" stop-opacity=".2" />
          <stop offset="1" stop-color="currentcolor" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line class="zero" x1="0" :x2="W" :y1="geo.zeroY" :y2="geo.zeroY" />
      <path class="area" :d="`${geo.d}L${W},${H}L0,${H}Z`" :fill="`url(#${gradientId})`" />
      <path class="line" :d="geo.d" />
    </svg>
    <template v-if="marker">
      <i class="dot" :style="marker.style" />
      <span class="tip mono" :style="marker.style">{{ marker.text }}</span>
    </template>
  </div>
</template>

<style scoped>
.spark {
  position: relative;
  height: 180px;
  color: var(--pos);
  cursor: crosshair;
}
.spark.neg {
  color: var(--neg);
}
svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.zero {
  stroke: var(--line-2);
  stroke-width: 1;
  stroke-dasharray: 4 5;
  vector-effect: non-scaling-stroke;
}
.area {
  opacity: 0;
  animation: fade-in 0.8s 0.9s forwards;
}
.line {
  fill: none;
  stroke: currentcolor;
  stroke-width: 2.2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  /* ponytail: reveal via clip-path (fill-box of the path, which always spans exactly [0, width] — see
     sparkGeometry) instead of stroke-dasharray+pathLength. The dash trick depends on the browser
     normalizing pathLength against non-uniformly scaled, non-scaling-stroke geometry, which some engines
     get wrong and stop short of the right edge; clip-path is a plain box-relative wipe, so it can't. */
  clip-path: fill-box inset(0 100% 0 0);
  animation: draw 1.3s 0.2s var(--out) forwards;
}
.dot,
.tip {
  position: absolute;
  pointer-events: none;
}
.dot {
  width: 12px;
  height: 12px;
  margin: -6px;
  border-radius: 50%;
  background: currentcolor;
  box-shadow: 0 0 0 3px var(--card);
}
.tip {
  margin-top: -40px;
  padding: 4px 8px;
  border-radius: 7px;
  background: var(--ink);
  color: var(--paper);
  font-size: 12px;
  white-space: nowrap;
  translate: -50% 0;
}
@keyframes fade-in {
  to {
    opacity: 1;
  }
}
@keyframes draw {
  to {
    clip-path: fill-box inset(0 0 0 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .area,
  .line {
    animation: none;
    opacity: 1;
    clip-path: none;
  }
}
</style>
