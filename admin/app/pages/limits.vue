<script setup lang="ts">
import type { RegistrationLimitDto } from '@dodep/shared';

const api = useApi();
const toast = useToast();
const { data } = useAsyncData('admin-limit', () => api<RegistrationLimitDto>('/admin/settings/registration-limit'));
const form = reactive({ count: 5, windowHours: 24, reason: '' });
watch(data, (value) => value && Object.assign(form, value), { immediate: true });

async function save() {
  try {
    await api('/admin/settings/registration-limit', {
      method: 'PUT',
      body: {
        count: Number(form.count),
        windowHours: Number(form.windowHours),
        reason: form.reason.trim() || undefined,
      },
    });
    form.reason = '';
    toast.show('Лимит сохранён', 'Записано в историю.', 'good');
    await refreshNuxtData();
  } catch (e) {
    toast.show('Не получилось', apiErrorMessage(e), 'bad');
  }
}
</script>

<template>
  <div class="page">
    <header class="intro">
      <h1>Лимит регистраций</h1>
      <p>
        Сколько аккаунтов можно создать с одного IP за окно. Сверх лимита человек увидит «Регистрация пока недоступна,
        повторите попытку позже».
      </p>
    </header>
    <UiPanel>
      <form class="limit" @submit.prevent="save">
        <label class="field"
          ><span>Регистраций</span><input v-model="form.count" type="number" min="1" max="1000" class="mono"
        /></label>
        <label class="field"
          ><span>Окно, часов</span><input v-model="form.windowHours" type="number" min="1" max="720" class="mono"
        /></label>
        <label class="field wide"
          ><span>Причина</span><input v-model="form.reason" maxlength="255" placeholder="необязательно"
        /></label>
        <UiButton variant="ink" type="submit">Сохранить</UiButton>
      </form>
    </UiPanel>
  </div>
</template>

<style scoped>
.page {
  display: contents;
}

.intro h1 {
  font-size: clamp(28px, 4vw, 40px);
}

.intro p {
  max-width: 620px;
  margin: 8px 0 0;
  color: var(--muted);
}

.limit {
  display: grid;
  grid-template-columns: 160px 160px 1fr auto;
  gap: 12px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.field input {
  height: 42px;
  padding: 0 12px;
  border: 1.5px solid var(--line);
  border-radius: 11px;
  background: var(--paper);
  color: var(--ink);
}

.field input:focus {
  border-color: var(--ink);
  outline: 0;
}

@media (width <= 760px) {
  .limit {
    grid-template-columns: 1fr;
  }
}
</style>
