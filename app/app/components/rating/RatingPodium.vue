<script setup lang="ts">
import type { PlayerDto } from '@dodep/shared';

defineProps<{ players: PlayerDto[]; me: string | null }>();
</script>

<template>
  <section v-if="players.length" class="podium">
    <NuxtLink v-for="p in players" :key="p.nickname" :to="playerPath(p.nickname)" class="pod" :class="`p${p.rank}`">
      <span class="place" aria-hidden="true">{{ p.rank }}</span>
      <UiAvatar :name="p.nickname" :kind="playerKind(p, me)" :size="48" />
      <span class="name">
        {{ p.nickname }}
        <UiTag v-if="playerKind(p, me) === 'me'" tone="me">ты</UiTag>
      </span>
      <q v-if="p.status">{{ p.status }}</q>
      <span class="bal mono">{{ fmt(p.balance) }} <UiCoin /></span>
    </NuxtLink>
  </section>
</template>

<style scoped>
.podium {
  display: grid;
  grid-template-columns: 1fr 1.12fr 1fr;
  gap: 14px;
  align-items: end;
  margin-bottom: 16px;
}
.pod {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 20px;
  border-radius: 22px;
  background: var(--card);
  border: 1px solid var(--line);
  transform-origin: bottom;
  animation: pod-in 0.7s var(--spring) both;
  transition:
    transform 0.25s var(--spring),
    box-shadow 0.25s;
}
.pod:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 30px -18px color-mix(in srgb, var(--ink) 40%, transparent);
}
.p1 {
  order: 2;
  min-height: 236px;
  background: var(--coin);
  border-color: var(--coin-d);
  animation-delay: 0.15s;
}
.p2 {
  order: 1;
  min-height: 204px;
  animation-delay: 0.05s;
}
.p3 {
  order: 3;
  min-height: 184px;
  animation-delay: 0.25s;
}
.place {
  position: absolute;
  top: 12px;
  right: 18px;
  font:
    700 54px/1 Unbounded,
    sans-serif;
  opacity: 0.14;
}
.name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 17px;
}
q {
  font-size: 14px;
  line-height: 1.4;
  quotes: '«' '»';
}
.bal {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 22px;
  font-weight: 600;
}
@keyframes pod-in {
  from {
    opacity: 0;
    transform: scaleY(0.6);
  }
}
@media (width <= 760px) {
  .podium {
    grid-template-columns: 1fr;
  }
  .p1,
  .p2,
  .p3 {
    order: 0;
    min-height: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pod {
    animation: none;
  }
}
</style>
