<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });
defineProps<{ title?: string }>();

const card = useTemplateRef<HTMLElement>('card');

onKeyStroke('Escape', () => {
  if (open.value) open.value = false;
});

watch(
  open,
  async (value) => {
    if (!value) return;
    await nextTick();
    const target = card.value?.querySelector<HTMLElement>('input, textarea, select') ?? card.value?.querySelector('button');
    target?.focus();
  },
  { immediate: true },
);
</script>

<template>
  <Teleport to="#teleports">
    <Transition name="modal">
      <div v-if="open" class="modal" @mousedown.self="open = false">
        <div ref="card" class="card" role="dialog" aria-modal="true" :aria-label="title">
          <h2 v-if="title">{{ title }}</h2>
          <slot />
          <div v-if="$slots.actions" class="actions"><slot name="actions" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
  background: #18160f8c;
  backdrop-filter: blur(4px);
}

.card {
  width: min(440px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 26px;
  border-radius: 24px;
  background: var(--card);
  box-shadow: 0 40px 80px -30px #000c;
}

.card > h2 {
  font-size: 22px;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.modal-enter-active,
.modal-leave-active {
  transition:
    background 0.25s,
    backdrop-filter 0.25s;
}

.modal-enter-active .card,
.modal-leave-active .card {
  transition:
    transform 0.35s var(--spring),
    opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  background: #18160f00;
  backdrop-filter: blur(0);
}

.modal-enter-from .card,
.modal-leave-to .card {
  opacity: 0;
  transform: translateY(18px) scale(0.97);
}
</style>
