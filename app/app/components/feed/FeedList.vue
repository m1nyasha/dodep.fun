<script setup lang="ts">
const { items, status, load } = useFeed();
const { me } = useMe();
onMounted(() => load().catch(() => undefined));
</script>

<template>
  <UiPanel>
    <template #actions>
      <h2 class="title"><i class="live" :class="{ off: status !== 'OPEN' }" />За столом</h2>
    </template>
    <TransitionGroup tag="ol" name="feed" class="feed">
      <FeedItem v-for="e in items" :key="`${e.nickname}-${e.at}`" :event="e" :mine="e.nickname === me?.nickname" />
    </TransitionGroup>
    <UiEmpty v-if="!items.length">За столом пока тихо.</UiEmpty>
  </UiPanel>
</template>

<style scoped>
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pos);
  color: var(--pos);
  animation: ping 1.8s infinite;
}

.live.off {
  background: var(--line-2);
  animation: none;
}

.feed {
  list-style: none;
  margin: 0;
  padding: 0;
}

.feed-enter-active {
  animation: feed-in 0.55s var(--spring);
}

.feed-leave-active {
  display: none;
}

@keyframes feed-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.97);
  }
}
</style>
