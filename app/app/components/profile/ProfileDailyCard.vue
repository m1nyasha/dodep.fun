<script setup lang="ts">
const emit = defineEmits<{ claimed: [] }>();
const daily = useDaily();
const wrap = useTemplateRef<HTMLElement>('wrap');
const claiming = ref(false);

async function claim() {
  claiming.value = true;
  try {
    await daily.claim(wrap.value ?? undefined);
    emit('claimed');
  } finally {
    claiming.value = false;
  }
}
</script>

<template>
  <UiPanel class="daily" :class="{ ready: daily.available.value }">
    <div>
      <h2>Ежедневная выдача</h2>
      <p class="muted">{{ daily.text.value }}</p>
    </div>
    <span v-if="daily.available.value" ref="wrap">
      <UiButton variant="coin" :loading="claiming" @click="claim">Забрать</UiButton>
    </span>
  </UiPanel>
</template>

<style scoped>
.daily {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.daily.ready {
  background: color-mix(in srgb, var(--coin) 28%, var(--card));
  border-color: color-mix(in srgb, var(--coin-d) 50%, var(--card));
}
h2 {
  font-size: 15px;
  margin-bottom: 4px;
}
p {
  margin: 0;
  font-size: 14px;
}
</style>
