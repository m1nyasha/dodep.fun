<script setup lang="ts">
const { me } = useMe();
const daily = useDaily();
const claimBtn = useTemplateRef<HTMLElement>('claim');
</script>

<template>
  <div class="pop" role="dialog" aria-label="Баланс">
    <div class="row">
      <span>Баланс</span><b class="mono">{{ fmt(me?.balance ?? 0) }}</b>
    </div>
    <div v-if="me" class="row">
      <span>Итог ставок</span><b class="mono" :class="me.net >= 0 ? 'pos' : 'neg'">{{ signed(me.net) }}</b>
    </div>
    <div class="daily" :class="{ ready: daily.available.value }">
      <div>
        <b>Ежедневно до {{ fmt(me?.dailyTarget ?? 10_000) }}</b>
        <span>{{ daily.text.value }}</span>
      </div>
      <button
        v-if="daily.available.value"
        ref="claim"
        type="button"
        class="claim"
        @click="daily.claim(claimBtn ?? undefined)"
      >
        Забрать
      </button>
    </div>
    <p class="note">Монеты виртуальные: их нельзя купить или вывести.</p>
  </div>
</template>

<style scoped>
.pop {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 5;
  width: 300px;
  padding: 16px;
  border-radius: 18px;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: 0 24px 50px -18px #2a201066;
  transform-origin: top right;
  animation: pop 0.25s var(--spring);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 3px 0;
  font-size: 14px;
  color: var(--muted);
}

.row b {
  color: var(--ink);
  font-size: 16px;
}

.row b.pos {
  color: var(--pos);
}

.row b.neg {
  color: var(--neg);
}

.daily {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--paper-2);
}

.daily b {
  display: block;
  font-size: 14px;
}

.daily span {
  display: block;
  font-size: 12.5px;
  line-height: 1.35;
  color: var(--muted);
  margin-top: 2px;
}

.daily.ready {
  background: #fff0bd;
}

.claim {
  height: 34px;
  padding: 0 13px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  background: var(--coin);
  box-shadow: 0 3px 0 var(--coin-d);
}

.note {
  margin: 10px 2px 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
