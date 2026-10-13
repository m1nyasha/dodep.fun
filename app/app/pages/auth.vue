<script setup lang="ts">
const route = useRoute();
const { isAuthed } = useMe();
const redirectTo = computed(() => safeRedirect(route.query.redirect));
if (isAuthed.value) await navigateTo(redirectTo.value);

const mode = computed(() => (route.query.mode === 'register' ? 'register' : 'login'));
useHead({ title: 'Вход — dodep.fun' });

function done() {
  setTimeout(() => navigateTo(redirectTo.value), 450);
}
</script>

<template>
  <section class="auth">
    <div class="art" aria-hidden="true">
      <AuthToy />
      <p>25 клеток, 5 мин<br />и одно решение — когда остановиться.</p>
    </div>
    <div class="box"><AuthForm :mode="mode" @done="done" /></div>
  </section>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 940px;
  margin: 12px auto 0;
  border-radius: 28px;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: 0 40px 70px -40px #2a201066;
}

.art {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 30px;
  padding: 44px;
  background: var(--c-bg);
  color: var(--c-text);
}

.art p {
  margin: 0;
  font: 600 21px/1.3 var(--font-display);
  letter-spacing: -0.03em;
}

.box {
  padding: 40px 44px;
}

@media (width <= 760px) {
  .auth {
    grid-template-columns: 1fr;
    border-radius: 24px;
  }

  .art {
    padding: 24px;
    flex-direction: row;
    align-items: center;
    gap: 18px;
  }

  .art p {
    font-size: 15px;
  }

  .box {
    padding: 24px;
  }
}
</style>
