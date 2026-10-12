<script setup lang="ts">
const { me } = useMe();
const sfx = useSfx();
</script>

<template>
  <header class="top">
    <NuxtLink class="logo" to="/" aria-label="dodep.fun — к игре">
      <UiLogo />
      <span>dodep<em>.fun</em></span>
    </NuxtLink>
    <LayoutNavBar />
    <div class="right">
      <ClientOnly>
        <button
          type="button"
          class="icon-btn"
          title="Звук"
          aria-label="Звук"
          :aria-pressed="sfx.enabled.value"
          @click="sfx.toggle"
        >
          <UiIcon :name="sfx.enabled.value ? 'sound' : 'mute'" />
        </button>
      </ClientOnly>
      <LayoutAdminButton v-if="me?.adminUrl" />
      <LayoutWalletButton />
      <NuxtLink v-if="me" class="me" :to="`/players/${encodeURIComponent(me.nickname)}`" title="Профиль">
        <UiAvatar :name="me.nickname" kind="me" :size="32" />
        <span>{{ me.nickname }}</span>
      </NuxtLink>
      <UiButton v-else size="sm" to="/auth">Войти</UiButton>
    </div>
  </header>
</template>

<style scoped>
.top {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 28px;
  height: 68px;
  padding: 0 max(24px, calc((100vw - 1280px) / 2));
  background: color-mix(in srgb, var(--paper) 86%, transparent);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font: 700 19px var(--font-display);
  letter-spacing: -0.05em;
}

.logo em {
  font-style: normal;
  color: var(--muted);
}

.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.right > * {
  flex: none;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: var(--muted);
  transition:
    background 0.2s,
    color 0.2s;
}

.icon-btn:hover {
  background: var(--paper-2);
  color: var(--ink);
}

.me {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 12px 4px 4px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}

.me:hover {
  background: var(--paper-2);
}

@media (width <= 760px) {
  .top {
    height: 60px;
    gap: 12px;
    padding: 0 14px;
    backdrop-filter: none;
    background: var(--paper);
  }

  .logo {
    font-size: 17px;
  }

  .right {
    gap: 4px;
  }

  .icon-btn {
    width: 36px;
  }

  .me {
    padding: 2px;
  }

  .me > span {
    display: none;
  }
}
</style>
