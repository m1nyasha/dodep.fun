<script setup lang="ts">
import type { AdminOverviewDto } from '@dodep/shared';

const api = useApi();
const me = useAdminMe();
const route = useRoute();
const { data: overview } = useAsyncData('admin-overview', () => api<AdminOverviewDto>('/admin/overview'));

const nav = computed(() => [
  { to: '/', label: 'Обзор', count: '' },
  { to: '/rules', label: 'Правила', count: overview.value ? `v${overview.value.activeRuleVersion}` : '' },
  { to: '/accounts', label: 'Аккаунты', count: overview.value?.blocked || '' },
  { to: '/statuses', label: 'Статусы', count: overview.value?.hiddenStatuses || '' },
  { to: '/limits', label: 'Лимиты', count: '' },
  { to: '/audit', label: 'История', count: '' },
  { to: '/export', label: 'Экспорт', count: '' },
]);

const isOn = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));

async function logout() {
  await api('/admin/auth/logout', { method: 'POST' });
  me.value = null;
  await navigateTo('/auth');
}
</script>

<template>
  <div class="shell">
    <header class="top">
      <NuxtLink to="/" class="brand" aria-label="Обзор"><UiLogo /></NuxtLink>
      <span class="role">панель автора</span>
      <span class="who">{{ me?.nickname }}</span>
      <UiButton variant="line" size="sm" @click="logout">Выйти</UiButton>
    </header>
    <div class="admin">
      <nav class="admin-nav" aria-label="Разделы">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="{ on: isOn(item.to) }"
          :aria-current="isOn(item.to) ? 'page' : undefined"
        >
          {{ item.label }}<span class="count mono">{{ item.count }}</span>
        </NuxtLink>
      </nav>
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.top {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 64px;
  padding: 0 max(24px, calc((100vw - 1280px) / 2));
  background: color-mix(in srgb, var(--paper) 86%, transparent);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.role {
  font-size: 13px;
  color: var(--muted);
}

.who {
  margin-left: auto;
  font-weight: 600;
}

.admin {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  max-width: 1280px;
  margin: 24px auto;
  padding: 0 24px;
}

.admin-nav {
  position: sticky;
  top: 88px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
}

.admin-nav a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 11px;
  font-weight: 600;
  font-size: 14px;
  color: var(--muted);
  transition:
    background 0.15s,
    color 0.15s;
}

.admin-nav a:hover {
  background: var(--paper);
  color: var(--ink);
}

.admin-nav a.on {
  background: var(--ink);
  color: var(--paper);
}

.count {
  font-size: 11px;
}

.content {
  display: grid;
  gap: 16px;
  min-width: 0;
}

@media (width <= 760px) {
  .admin {
    grid-template-columns: 1fr;
  }

  .admin-nav {
    position: static;
    flex-flow: row wrap;
  }
}
</style>
