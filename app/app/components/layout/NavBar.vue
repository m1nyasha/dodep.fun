<script setup lang="ts">
const NAV = [
  { to: '/', label: 'Игра', icon: 'grid' },
  { to: '/rating', label: 'Рейтинг', icon: 'trophy' },
  { to: '/rules', label: 'Правила', icon: 'book' },
  { to: '/journal', label: 'Журнал', icon: 'list' },
] as const;

const route = useRoute();
const nav = useTemplateRef<HTMLElement>('nav');
const hovered = ref<string | null>(null);
const pill = reactive({ x: 0, w: 0, visible: false, ready: false });
const active = computed(
  () => NAV.find((n) => (n.to === '/' ? route.path === '/' : route.path.startsWith(n.to)))?.to ?? null,
);

function place() {
  const to = hovered.value ?? active.value;
  const link = to ? nav.value?.querySelector<HTMLElement>(`a[data-to="${to}"]`) : null;
  pill.visible = !!link;
  if (!link) return;
  pill.x = link.offsetLeft - 4;
  pill.w = link.offsetWidth;
}

useResizeObserver(nav, place);
watch([active, hovered], () => nextTick(place));
onMounted(() => {
  place();
  void document.fonts?.ready.then(place);
  requestAnimationFrame(() => (pill.ready = true));
});
</script>

<template>
  <nav ref="nav" class="nav" :class="{ ready: pill.ready }" @mouseleave="hovered = null">
    <NuxtLink
      v-for="n in NAV"
      :key="n.to"
      :to="n.to"
      :data-to="n.to"
      :class="{ on: n.to === active }"
      :aria-current="n.to === active ? 'page' : undefined"
      @mouseenter="hovered = n.to"
    >
      <UiIcon :name="n.icon" />
      <span>{{ n.label }}</span>
    </NuxtLink>
    <i
      class="pill"
      :style="{ width: `${pill.w}px`, transform: `translateX(${pill.x}px)`, opacity: pill.visible ? 1 : 0 }"
    />
  </nav>
</template>

<style scoped>
.nav {
  position: relative;
  display: flex;
  gap: 2px;
  padding: 4px;
  border-radius: 13px;
  background: var(--paper-2);
}

a {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 14px;
  color: var(--muted);
  transition: color 0.2s;
}

a :deep(.ui-icon) {
  display: none;
  width: 18px;
  height: 18px;
}

a.on,
a:hover {
  color: var(--ink);
}

.pill {
  position: absolute;
  z-index: 0;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: 0;
  border-radius: 9px;
  background: var(--card);
  box-shadow:
    0 1px 0 var(--line-2),
    0 3px 8px #2a201012;
}

.ready .pill {
  transition:
    transform 0.4s var(--spring),
    width 0.4s var(--spring),
    opacity 0.2s;
}

@media (width <= 760px) {
  .nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: calc(10px + env(safe-area-inset-bottom));
    z-index: 50;
    justify-content: space-around;
    padding: 6px;
    border-radius: 20px;
    background: var(--ink);
    box-shadow: 0 16px 34px -10px #000b;
  }

  a {
    flex: 1;
    flex-direction: column;
    gap: 2px;
    padding: 7px 4px 6px;
    font-size: 11px;
    color: #a39b86;
  }

  a :deep(.ui-icon) {
    display: block;
  }

  a.on,
  a:hover {
    color: var(--paper);
  }

  .pill {
    top: 6px;
    bottom: 6px;
    background: #ffffff16;
    box-shadow: none;
  }
}
</style>
