<script setup lang="ts">
const api = useApi();
const toast = useToast();
const loading = ref(false);

async function go() {
  loading.value = true;
  try {
    const { url } = await api<{ url: string }>('/me/admin-ticket', { method: 'POST' });
    location.href = url;
  } catch (e) {
    toast.show('Не удалось открыть админку', apiErrorMessage(e), 'bad');
    loading.value = false;
  }
}
</script>

<template>
  <button type="button" class="icon-btn" title="Админка" aria-label="Админка" :disabled="loading" @click="go">
    <UiIcon name="shield" />
  </button>
</template>

<style scoped>
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
</style>
