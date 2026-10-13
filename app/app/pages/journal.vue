<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

useSeoMeta({
  title: 'Журнал — dodep.fun',
  description: 'Каждый раунд: ставка, исход, выплата и раскладка мин, которую можно сверить с хэшем.',
});

const { me, isAuthed } = useMe();
const authModal = useAuthModal();
const toast = useToast();
const reduced = useReducedMotion();
const route = useRoute();
const journal = useJournal();
const { items, nextCursor, pending } = journal;

await useAsyncData('journal:first', () => (isAuthed.value ? journal.load(true) : Promise.resolve()).then(() => true));
watch(isAuthed, (authed) => authed && journal.load(true));

const openRows = reactive<Record<string, boolean>>({});
const flashId = ref<string | null>(null);
const points = computed(() => cumulativeNet(items.value));

onMounted(async () => {
  const id = decodeURIComponent(route.hash.slice(1));
  // ponytail: якорь ищется только среди загруженной первой страницы — со страницы игры ссылка всегда ведёт на свежий раунд.
  if (!id || !items.value.some((r) => r.id === id)) return;
  openRows[id] = true;
  flashId.value = id;
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: reduced.value ? 'auto' : 'smooth' });
});

function exportJson() {
  const n = items.value.length;
  const url = URL.createObjectURL(
    new Blob([journalJson(me.value!.nickname, items.value)], { type: 'application/json' }),
  );
  const a = Object.assign(document.createElement('a'), { href: url, download: 'dodep-journal.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.show('Журнал скачан', `${n} ${plural(n, 'раунд', 'раунда', 'раундов')} в JSON.`);
}
</script>

<template>
  <div>
    <PageIntro title="Журнал">
      Каждый твой раунд: ставка, исход, выплата и раскладка мин, которую можно сверить с хэшем.
      <template v-if="isAuthed" #actions>
        <UiButton variant="line" :disabled="!items.length" @click="exportJson"><UiIcon name="down" />JSON</UiButton>
      </template>
    </PageIntro>

    <UiEmpty v-if="!isAuthed || !me" big>
      Журнал ведётся для твоего аккаунта.
      <UiButton variant="ink" size="sm" @click="authModal.open('login')">Войти</UiButton>
    </UiEmpty>

    <template v-else>
      <section class="kpis">
        <UiKpi label="Раундов" :value="me.roundsCount" />
        <UiKpi label="Поставлено" :value="me.wagered" />
        <UiKpi label="Выплачено" :value="me.payout" />
        <UiKpi label="Итог ставок" :value="me.net" format="signed" :tone="me.net >= 0 ? 'pos' : 'neg'" />
      </section>

      <UiPanel v-if="points.length > 2" title="Итог по раундам" class="chart">
        <template #actions>
          <UiTag tone="muted">по {{ items.length }} {{ plural(items.length, 'раунду', 'раундам', 'раундам') }}</UiTag>
        </template>
        <JournalSpark :points="points" />
      </UiPanel>

      <UiPanel class="list">
        <div v-if="items.length" class="jhead" aria-hidden="true">
          <span /><span>Раунд</span><span>Ставка</span><span>Клеток</span><span>Выплата</span><span>Итог</span><span />
        </div>
        <JournalRow v-for="r in items" :key="r.id" v-model:open="openRows[r.id]" :round="r" :flash="flashId === r.id" />
        <UiEmpty v-if="!items.length" big>
          Пока пусто. <NuxtLink to="/">Сыграй первый раунд</NuxtLink> — он появится здесь.
        </UiEmpty>
        <UiButton
          v-if="nextCursor"
          variant="line"
          size="sm"
          class="more"
          :loading="pending"
          @click="journal.loadMore()"
        >
          Показать ещё
        </UiButton>
      </UiPanel>
      <p class="tnote">
        Журнал ведёт сервер. Хэш раскладки показывается до первого хода, мины и соль — после конца раунда: пересчитай
        SHA-256 сам или нажми «Проверить».
      </p>
    </template>
  </div>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.chart {
  margin-bottom: 16px;
}
.list {
  padding: 8px 20px;
}
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
.tnote {
  font-size: 13px;
  color: var(--muted);
  margin: 14px 0 0;
  max-width: 760px;
}
@media (width <= 760px) {
  .kpis {
    grid-template-columns: 1fr 1fr;
  }
  .jhead {
    display: none;
  }
}
</style>
