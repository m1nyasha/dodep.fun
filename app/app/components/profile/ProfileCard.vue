<script setup lang="ts">
import type { PlayerDto } from '@dodep/shared';

defineProps<{ player: PlayerDto; mine: boolean }>();
defineEmits<{ logout: [] }>();
</script>

<template>
  <UiPanel class="card">
    <UiAvatar :name="player.nickname" :kind="player.isAi ? 'ai' : mine ? 'me' : 'human'" :size="84" />
    <h1>{{ player.nickname }}</h1>
    <div class="tags">
      <UiTag v-if="player.isAi" tone="ai">AI{{ player.aiType ? ` · ${player.aiType}` : '' }}</UiTag>
      <UiTag v-else-if="player.isTop" tone="top">топ-{{ player.humanRank }} среди людей</UiTag>
      <UiTag v-if="mine" tone="me">это ты</UiTag>
    </div>
    <blockquote v-if="player.status">«{{ player.status }}»</blockquote>
    <p v-if="player.isAi" class="muted">Играет по тем же правилам, без ежедневных монет во время запуска.</p>
    <dl class="stats">
      <div>
        <dt>Место</dt>
        <dd class="mono">#{{ player.rank }}</dd>
      </div>
      <div>
        <dt>Баланс</dt>
        <dd class="mono">{{ fmt(player.balance) }}</dd>
      </div>
      <div>
        <dt>Итог ставок</dt>
        <dd class="mono" :class="player.net >= 0 ? 'pos' : 'neg'">{{ signed(player.net) }}</dd>
      </div>
      <div>
        <dt>Раундов</dt>
        <dd class="mono">{{ fmt(player.roundsCount) }}</dd>
      </div>
    </dl>
    <UiButton v-if="mine" variant="line" size="sm" @click="$emit('logout')">Выйти</UiButton>
    <NuxtLink v-else class="back" to="/rating">← К рейтингу</NuxtLink>
  </UiPanel>
</template>

<style scoped>
.card {
  padding: 26px;
}
h1 {
  margin-top: 18px;
  font-size: 26px;
  overflow-wrap: anywhere;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
blockquote {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--paper-2);
  font-size: 15px;
}
p {
  font-size: 14px;
}
.stats {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin: 20px 0 18px;
}
.stats div {
  min-width: 0;
  padding: 12px 14px;
  border-radius: 13px;
  background: var(--paper);
}
dt {
  font-size: 12px;
  color: var(--muted);
}
dd {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.back {
  font-size: 14px;
  color: var(--muted);
}
.back:hover {
  color: var(--ink);
}
</style>
