<script setup lang="ts">
import { normalizeStatus, STATUS_MAX, type MeDto, type PlayerDto } from '@dodep/shared';

const props = defineProps<{ player: PlayerDto; me: MeDto }>();
const emit = defineEmits<{ saved: [] }>();
const api = useApi();
const toast = useToast();
const { play } = useSfx();

const text = ref(props.me.status ?? '');
const saving = ref(false);
const preview = computed(() => normalizeStatus(text.value));

async function save() {
  saving.value = true;
  try {
    const fresh = await api<MeDto>('/me/status', { method: 'PUT', body: { text: text.value } });
    text.value = fresh.status ?? '';
    play('win');
    toast.show('Статус опубликован', fresh.status ? 'Он уже виден в рейтинге.' : 'Статус очищен.', 'good');
    emit('saved');
  } catch (e) {
    toast.show('Не получилось сохранить', apiErrorMessage(e), 'bad');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UiPanel title="Публичный статус">
    <template #actions><UiTag tone="muted">топ-5 людей</UiTag></template>
    <form @submit.prevent="save">
      <textarea
        v-model="text"
        :maxlength="STATUS_MAX"
        placeholder="Короткая мысль о своей игре"
        aria-label="Публичный статус"
      />
      <div class="meta">
        <span class="counter mono" :class="{ warn: text.length > STATUS_MAX - 12 }"
          >{{ text.length }}/{{ STATUS_MAX }}</span
        >
        <UiButton variant="ink" size="sm" type="submit" :loading="saving">Опубликовать</UiButton>
      </div>
    </form>
    <div class="preview">
      <small>Так увидят в рейтинге</small>
      <div class="who">
        <UiAvatar :name="player.nickname" kind="me" :size="34" />
        <div>
          <b>{{ player.nickname }}</b>
          <UiTag tone="top">топ-{{ player.humanRank }}</UiTag>
          <small>«{{ preview || '…' }}»</small>
        </div>
      </div>
    </div>
    <p v-if="me.statusHidden" class="hidden">Модератор скрыл статус: в рейтинге его не видно, пока автор не вернёт.</p>
    <p class="muted small">
      Публикуется сразу, ссылки вырезаются. Право пропадёт, если опустишься ниже пятого места среди людей.
    </p>
  </UiPanel>
</template>

<style scoped>
textarea {
  display: block;
  width: 100%;
  min-height: 84px;
  resize: vertical;
  padding: 12px 14px;
  border-radius: 13px;
  border: 1.5px solid var(--line-2);
  background: var(--paper);
  outline: 0;
  font-size: 15px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
textarea:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ink) 6%, transparent);
}
.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.counter {
  font-size: 12px;
  color: var(--muted);
}
.counter.warn {
  color: var(--neg);
}
.preview {
  margin: 14px 0 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px dashed var(--line-2);
}
.preview > small {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--muted);
}
.who {
  display: flex;
  align-items: center;
  gap: 12px;
}
.who b {
  margin-right: 4px;
}
.who small {
  display: block;
  font-size: 12.5px;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.hidden {
  margin: 0 0 8px;
  color: var(--neg);
  font-size: 13.5px;
}
.small {
  margin: 0;
  font-size: 13.5px;
}
</style>
