<script setup lang="ts">
import type { RoundDto } from '@dodep/shared';

const props = defineProps<{ round: RoundDto | null; broke: boolean }>();

const daily = useDaily();
const walletOpen = useState('wallet-open', () => false);
const mode = computed(() => {
  if (props.round?.status === 'active') return 'live';
  if (props.broke) return 'broke';
  if (props.round) return 'done';
  return 'idle';
});
</script>

<template>
  <div class="seal">
    <template v-if="mode === 'live'">
      <UiIcon name="lock" />
      <span
        >Раскладка зафиксирована ·
        <span class="mono" title="SHA-256 раскладки">{{ round!.hash.slice(0, 12) }}</span></span
      >
    </template>
    <template v-else-if="mode === 'broke'">
      <span>{{ daily.text.value }}</span>
      <button v-if="daily.available.value" type="button" class="link" @click.stop="walletOpen = true">Забрать</button>
    </template>
    <template v-else-if="mode === 'done'">
      <UiIcon name="check" />
      <span>Раунд записан · <NuxtLink :to="`/journal#${round!.id}`">сверить раскладку</NuxtLink></span>
    </template>
    <template v-else>
      <UiIcon name="lock" />
      <span>Мины расставляются до первого хода и не двигаются</span>
    </template>
  </div>
</template>

<style scoped>
.seal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 20px;
  margin: 14px auto 0;
  font-size: 12.5px;
  color: var(--c-muted);
  text-align: center;
}

.seal :deep(.ui-icon) {
  width: 15px;
  height: 15px;
}

a,
.link {
  color: var(--c-text);
  border-bottom: 1px solid #ffffff38;
  font-weight: 600;
}

.mono {
  color: var(--c-text);
}
</style>
