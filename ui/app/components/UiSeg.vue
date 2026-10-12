<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{ options: { value: string; label: string }[]; wide?: boolean }>();

const root = useTemplateRef<HTMLElement>('root');
const thumb = reactive({ x: 0, w: 0, ready: false });

function place() {
  const on = root.value?.querySelector<HTMLElement>('button[aria-pressed="true"]');
  if (!on) return;
  thumb.x = on.offsetLeft - 3;
  thumb.w = on.offsetWidth;
}

useResizeObserver(root, place);
watch(model, () => nextTick(place));
onMounted(() => {
  place();
  void document.fonts?.ready.then(place);
  requestAnimationFrame(() => (thumb.ready = true));
});
</script>

<template>
  <div ref="root" class="seg" :class="{ wide, ready: thumb.ready }" role="group">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      :aria-pressed="o.value === model ? 'true' : 'false'"
      :class="{ on: o.value === model }"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
    <i class="thumb" :style="{ width: `${thumb.w}px`, transform: `translateX(${thumb.x}px)` }" />
  </div>
</template>

<style scoped>
.seg {
  position: relative;
  display: inline-flex;
  padding: 3px;
  border-radius: 11px;
  background: var(--paper-2);
}

button {
  position: relative;
  z-index: 1;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--muted);
  transition: color 0.2s;
}

button.on,
button:hover {
  color: var(--ink);
}

.thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  border-radius: 8px;
  background: var(--card);
  box-shadow:
    0 1px 0 var(--line-2),
    0 2px 6px #2a201014;
}

.ready .thumb {
  transition:
    transform 0.35s var(--spring),
    width 0.35s var(--spring);
}

.wide {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  width: 100%;
}
</style>
