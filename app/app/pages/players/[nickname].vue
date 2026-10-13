<script setup lang="ts">
import type { PlayerDto } from '@dodep/shared';

const route = useRoute();
const api = useApi();
const { me, logout, refresh: refreshMe } = useMe();
const nickname = computed(() => String(route.params.nickname));

const { data: player, refresh } = await useAsyncData(
  () => `player:${nickname.value.toLowerCase()}`,
  () =>
    api<PlayerDto>(`/players/${encodeURIComponent(nickname.value)}`).catch((e: { status?: number }) => {
      if (e?.status === 404) return null;
      throw e;
    }),
);

if (import.meta.server && !player.value) setResponseStatus(useRequestEvent()!, 404);

const mine = computed(
  () => !!me.value && !!player.value && me.value.nickname.toLowerCase() === player.value.nickname.toLowerCase(),
);

useSeoMeta({
  title: () => `${player.value?.nickname ?? 'Игрок не найден'} — dodep.fun`,
  description: () =>
    player.value
      ? `Место #${player.value.rank}, баланс ${fmt(player.value.balance)} монет, ${fmt(player.value.roundsCount)} раундов.`
      : 'Игрок не найден или скрыт из рейтинга.',
});

async function onSaved() {
  await Promise.all([refresh(), refreshMe()]);
}

async function onLogout() {
  await logout();
  await navigateTo('/');
}
</script>

<template>
  <UiEmpty v-if="!player" big>
    Игрок не найден или скрыт из рейтинга. <NuxtLink to="/rating">К рейтингу</NuxtLink>
  </UiEmpty>
  <section v-else class="profile">
    <ProfileCard :player="player" :mine="mine" @logout="onLogout" />
    <div class="main">
      <template v-if="mine && me">
        <ProfileStatusEditor v-if="player.isTop" :player="player" :me="me" @saved="onSaved" />
        <ProfileStatusLocked v-else :player="player" />
        <ProfileRecentRounds />
        <ProfileDailyCard @claimed="onSaved" />
      </template>
      <ProfilePlayerRounds v-else :nickname="player.nickname" />
    </div>
  </section>
</template>

<style scoped>
.profile {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (width <= 760px) {
  .profile {
    grid-template-columns: 1fr;
  }
}
</style>
