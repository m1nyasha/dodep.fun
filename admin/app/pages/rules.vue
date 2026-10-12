<script setup lang="ts">
import type { RuleVersionDto, RuleVersionInput } from '@dodep/shared';

const api = useApi();
const toast = useToast();
const { data } = useAsyncData('admin-rules', () => api<RuleVersionDto[]>('/admin/rules'));
const active = computed(() => data.value?.find((r) => r.isActive));
const action = useReasonAction();

async function create(input: RuleVersionInput) {
  try {
    const created = await api<RuleVersionDto>('/admin/rules', { method: 'POST', body: input });
    toast.show(`Создана v${created.version}`, 'Она не активна — активируйте, когда будете готовы.', 'good');
    await refreshNuxtData();
  } catch (e) {
    toast.show('Не получилось', apiErrorMessage(e), 'bad');
  }
}

function activate(rule: RuleVersionDto) {
  action.ask({
    path: `/admin/rules/${rule.version}/activate`,
    title: `Активировать v${rule.version}`,
    confirmLabel: 'Активировать',
    optional: true,
    description: 'Новые раунды пойдут по этой версии. Уже начатые доиграются по своей.',
    done: `Активна v${rule.version}`,
  });
}
</script>

<template>
  <div class="page">
    <header class="intro"><h1>Правила</h1></header>
    <UiPanel v-if="active" :title="`Действуют v${active.version}`">
      <template #actions
        ><UiTag tone="muted"><UiIcon name="lock" /> зафиксированы</UiTag></template
      >
      <CfgGrid :rule="active" />
      <p class="note">Версии не редактируются. Пока идёт запуск агентов, активную версию не меняйте.</p>
    </UiPanel>
    <UiPanel title="Версии">
      <div class="rows">
        <div v-for="r in data ?? []" :key="r.version" class="arow">
          <b class="mono">v{{ r.version }}</b>
          <div class="grow">
            <span class="mono"
              >RTP {{ pct(r.rtp) }} · ставка {{ fmt(r.minBet) }}/{{ fmt(r.betStep) }} · старт
              {{ fmt(r.startBalance) }} · выдача {{ fmt(r.dailyTarget) }}</span
            >
            <small
              >{{ stamp(r.createdAt) }}<template v-if="r.createdBy"> · {{ r.createdBy }}</template></small
            >
          </div>
          <UiTag v-if="r.isActive" tone="top">активна</UiTag>
          <UiButton v-else size="sm" variant="line" @click="activate(r)">Активировать</UiButton>
        </div>
      </div>
    </UiPanel>
    <UiPanel v-if="active" title="Новая версия">
      <RuleForm :key="active.version" :initial="active" @submit="create" />
    </UiPanel>
    <ReasonModal
      v-if="action.target.value"
      v-model:open="action.open.value"
      :title="action.target.value.title"
      :confirm-label="action.target.value.confirmLabel"
      :description="action.target.value.description"
      :optional="action.target.value.optional"
      @confirm="action.run"
    />
  </div>
</template>

<style scoped>
.page {
  display: contents;
}

.intro h1 {
  font-size: clamp(28px, 4vw, 40px);
}

.note {
  margin: 12px 0 0;
  font-size: 13.5px;
  color: var(--muted);
}

.rows {
  display: flex;
  flex-direction: column;
}

.arow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px solid var(--line);
}

.arow:first-child {
  border-top: 0;
}

.grow {
  flex: 1;
  min-width: 0;
}

.grow small {
  display: block;
  font-size: 12.5px;
  color: var(--muted);
}
</style>
