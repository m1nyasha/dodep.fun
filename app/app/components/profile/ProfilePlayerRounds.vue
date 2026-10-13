<script setup lang="ts">
const props = defineProps<{ nickname: string }>();
const nickname = computed(() => props.nickname);
const rounds = usePlayerRounds(nickname);
const { items, nextCursor, pending } = rounds;
const openRows = reactive<Record<string, boolean>>({});

await useAsyncData(`player-rounds:${nickname.value.toLowerCase()}`, () => rounds.load(true).then(() => true));
</script>

<template>
  <UiPanel title="История раундов">
    <div v-if="items.length" class="jhead" aria-hidden="true">
      <span /><span>Раунд</span><span>Ставка</span><span>Клеток</span><span>Выплата</span><span>Итог</span><span />
    </div>
    <JournalRow v-for="r in items" :key="r.id" v-model:open="openRows[r.id]" :round="r" />
    <UiEmpty v-if="!items.length" big>Раундов пока нет.</UiEmpty>
    <UiButton v-if="nextCursor" variant="line" size="sm" class="more" :loading="pending" @click="rounds.loadMore()">
      Показать ещё
    </UiButton>
  </UiPanel>
</template>

<style scoped>
.jhead {
  display: grid;
  grid-template-columns: 14px 1.6fr 1fr 0.7fr 1fr 1fr 24px;
  gap: 14px;
  padding: 10px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
.more {
  display: flex;
  margin: 14px auto 6px;
}
@media (width <= 760px) {
  .jhead {
    display: none;
  }
}
</style>
