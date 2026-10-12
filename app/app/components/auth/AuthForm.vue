<script setup lang="ts">
import type { LoginBody, RegisterBody } from '@dodep/shared';

const props = defineProps<{ mode: 'login' | 'register' }>();
const emit = defineEmits<{ done: [] }>();

const api = useApi();
const { refresh } = useMe();
const toast = useToast();
const sfx = useSfx();

const mode = ref(props.mode);
watch(() => props.mode, (m) => (mode.value = m));
const register = computed(() => mode.value === 'register');

const form = reactive({ nickname: '', password: '', agree: false });
const errors = reactive({ nickname: '', password: '', agree: false, common: '' });
const loading = ref(false);
const nudge = useReplay(400);

const MODES = [
  { value: 'login', label: 'Вход' },
  { value: 'register', label: 'Регистрация' },
];

function clear() {
  Object.assign(errors, { nickname: '', password: '', agree: false, common: '' });
}

watch(mode, clear);
watch(() => form.nickname, () => (errors.nickname = ''));
watch(() => form.password, () => (errors.password = ''));
watch(() => form.agree, () => (errors.agree = false));

function validate(): boolean {
  clear();
  const nickname = form.nickname.trim();
  if (!/^[\p{L}\p{N}_]{3,20}$/u.test(nickname)) errors.nickname = '3–20 символов: буквы, цифры или _';
  if (form.password.length < 8) errors.password = 'Нужно минимум 8 символов';
  if (register.value && !form.agree) errors.agree = true;
  return !errors.nickname && !errors.password && !errors.agree;
}

function showError(e: unknown) {
  const code = e instanceof ApiFetchError ? e.code : undefined;
  const message = apiErrorMessage(e);
  if (code === 'NICKNAME_TAKEN') errors.nickname = message;
  else if (code === 'ACCOUNT_BLOCKED') errors.nickname = 'Аккаунт заблокирован автором';
  else if (code === 'INVALID_CREDENTIALS') errors.password = 'Неверный ник или пароль';
  else errors.common = message;
}

async function submit() {
  if (loading.value) return;
  if (!validate()) {
    nudge.play();
    sfx.play('lose');
    return;
  }
  loading.value = true;
  try {
    const hash = (await clientHash()) || undefined;
    const nickname = form.nickname.trim();
    if (register.value) {
      const body: RegisterBody = { nickname, password: form.password, agree: true, clientHash: hash };
      await api('/auth/register', { method: 'POST', body });
    } else {
      const body: LoginBody = { nickname, password: form.password, clientHash: hash };
      await api('/auth/login', { method: 'POST', body });
    }
    await refresh();
    sfx.play('win');
    toast.show(
      register.value ? 'Аккаунт создан' : 'С возвращением',
      register.value ? `${nickname}, на балансе 10 000 монет.` : undefined,
      'good',
    );
    emit('done');
  } catch (e) {
    showError(e);
    nudge.play();
    sfx.play('lose');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="auth-form" :class="{ nudge: nudge.on.value }" novalidate @submit.prevent="submit">
    <UiSeg v-model="mode" :options="MODES" wide />
    <h1>{{ register ? 'Новый игрок' : 'С возвращением' }}</h1>
    <p v-if="register" class="sub">10 000 монет на старте. Email не нужен.</p>

    <label class="field" :class="{ err: errors.nickname }" data-field="nickname">
      <span>Никнейм</span>
      <input
        v-model="form.nickname"
        name="nickname"
        maxlength="20"
        autocomplete="username"
        placeholder="например, kletka17"
        spellcheck="false"
      />
      <em class="field-msg">{{ errors.nickname }}</em>
    </label>

    <AuthPasswordField
      v-model="form.password"
      :error="errors.password"
      :meter="register"
      :autocomplete="register ? 'new-password' : 'current-password'"
    />

    <label v-if="register" class="check" :class="{ err: errors.agree }">
      <input v-model="form.agree" type="checkbox" name="agree" />
      <span>Понимаю: восстановить пароль нельзя — без него доступ к аккаунту пропадёт.</span>
    </label>

    <p v-if="errors.common" class="form-error" role="alert">{{ errors.common }}</p>

    <UiButton type="submit" wide class="submit" :loading="loading">{{ register ? 'Создать аккаунт' : 'Войти' }}</UiButton>
  </form>
</template>

<style scoped>
h1 {
  margin: 26px 0 6px;
  font-size: 28px;
}

.sub {
  margin: 0;
  color: var(--muted);
}

.field {
  display: block;
  margin-top: 16px;
}

.field > span {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

.field input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border-radius: 13px;
  border: 1.5px solid var(--line-2);
  background: var(--paper);
  outline: 0;
  font-size: 15px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.field input:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 4px #18160f10;
}

.field.err input {
  border-color: var(--mine);
}

.field-msg {
  display: block;
  font-style: normal;
  font-size: 12.5px;
  color: var(--neg);
}

.field-msg:not(:empty) {
  margin-top: 5px;
}

.check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 18px;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--muted);
  cursor: pointer;
}

.check input {
  appearance: none;
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin: 0;
  border-radius: 6px;
  border: 1.5px solid var(--line-2);
  background: var(--paper);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.check input:checked {
  background: var(--ink);
  border-color: var(--ink);
}

.check input:checked::after {
  content: '';
  width: 9px;
  height: 5px;
  margin-top: -2px;
  border: 2px solid var(--paper);
  border-top: 0;
  border-right: 0;
  transform: rotate(-45deg);
}

.check.err input {
  border-color: var(--mine);
}

.check.err span {
  color: var(--neg);
}

.form-error {
  margin: 16px 0 0;
  padding: 10px 12px;
  border-radius: 11px;
  background: #ffe7e1;
  color: var(--neg);
  font-size: 13.5px;
}

.submit {
  margin-top: 22px;
  height: 52px;
  font-size: 15.5px;
}
</style>
