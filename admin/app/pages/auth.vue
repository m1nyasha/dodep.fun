<script setup lang="ts">
import type { AdminMeDto } from '@dodep/shared';

definePageMeta({ layout: false });

const api = useApi();
const me = useAdminMe();
const route = useRoute();
const siteUrl = useRuntimeConfig().public.siteUrl;
const state = ref<'checking' | 'denied'>('checking');

onMounted(async () => {
  const ticket = typeof route.query.ticket === 'string' ? route.query.ticket : null;
  history.replaceState(history.state, '', '/auth');
  try {
    me.value = ticket
      ? await api<AdminMeDto>('/admin/auth/exchange', { method: 'POST', body: { ticket } })
      : await api<AdminMeDto>('/admin/me');
    await navigateTo('/', { replace: true });
  } catch {
    state.value = 'denied';
  }
});
</script>

<template>
  <main class="gate">
    <UiPanel class="card">
      <UiLogo />
      <p v-if="state === 'checking'" class="muted" aria-live="polite">Проверяем доступ…</p>
      <template v-else>
        <h1>Нужен вход</h1>
        <p class="muted">Войдите на dodep.fun и нажмите «Админка» в шапке — ссылка действует минуту.</p>
        <UiButton variant="ink" :to="siteUrl">На dodep.fun</UiButton>
      </template>
    </UiPanel>
  </main>
</template>

<style scoped>
.gate {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
}

.card {
  display: grid;
  gap: 14px;
  justify-items: start;
  width: min(420px, 100%);
}

h1 {
  font-size: 26px;
}

.muted {
  margin: 0;
  color: var(--muted);
}
</style>
