<script setup lang="ts">
const props = withDefaults(
  defineProps<{ title: string; confirmLabel: string; description?: string; danger?: boolean; optional?: boolean }>(),
  { description: '', danger: false, optional: false },
);
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ confirm: [reason: string] }>();

const reason = ref('');
const error = ref(false);

watch(open, (value) => {
  if (value) {
    reason.value = '';
    error.value = false;
  }
});

function confirm() {
  const text = reason.value.trim();
  if (!text && !props.optional) {
    error.value = true;
    return;
  }
  emit('confirm', text);
}
</script>

<template>
  <UiModal v-model:open="open" :title="title">
    <p v-if="description" class="desc">{{ description }}</p>
    <textarea
      v-model="reason"
      class="reason"
      :class="{ err: error }"
      maxlength="255"
      :placeholder="optional ? 'Причина (необязательно)' : 'Причина'"
      aria-label="Причина"
      :aria-invalid="error"
      @input="error = false"
    />
    <p v-if="error" class="msg" role="alert">Укажите причину — она попадёт в историю.</p>
    <template #actions>
      <UiButton variant="line" @click="open = false">Отмена</UiButton>
      <UiButton :variant="danger ? 'danger' : 'ink'" data-test="confirm" @click="confirm">{{ confirmLabel }}</UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.desc {
  margin: 0 0 12px;
  color: var(--muted);
}

.reason {
  width: 100%;
  min-height: 96px;
  padding: 12px 14px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--paper);
  resize: vertical;
}

.reason:focus {
  border-color: var(--ink);
  outline: 0;
}

.reason.err {
  border-color: var(--neg);
}

.msg {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--neg);
}
</style>
