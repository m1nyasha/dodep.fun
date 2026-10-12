<script setup lang="ts">
import { multiplier, type FeedEventDto } from '@dodep/shared';

const props = defineProps<{ event: FeedEventDto; mine: boolean }>();
const { rules } = useRules();
const detail = computed(() =>
  props.event.win
    ? `стоп на ${props.event.safeCount}-й · ${fx(multiplier(props.event.safeCount, rules.value?.rtp ?? 0.973))}`
    : `мина на ${props.event.safeCount + 1}-й`,
);
</script>

<template>
  <li>
    <UiAvatar :name="event.nickname" :kind="event.isAi ? 'ai' : mine ? 'me' : 'human'" :size="30" />
    <div>
      <span class="who"
        ><b>{{ event.nickname }}</b
        ><UiTag v-if="event.isAi" tone="ai">AI</UiTag><UiTag v-else-if="mine" tone="me">ты</UiTag></span
      >
      <small>{{ detail }}</small>
    </div>
    <b class="mono" :class="event.net >= 0 ? 'pos' : 'neg'">{{ signed(event.net) }}</b>
  </li>
</template>

<style scoped>
li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
}

li:first-child {
  border-top: 0;
}

li > div {
  flex: 1;
  min-width: 0;
}

.who {
  display: flex;
  align-items: center;
  min-width: 0;
}

.who b {
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

small {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

li > .mono {
  font-size: 13px;
  font-weight: 600;
}
</style>
