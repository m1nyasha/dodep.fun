import type { FinishedRoundDto, RoundsPageDto } from '@dodep/shared';

export function usePlayerRounds(nickname: Ref<string>, pageSize = 20) {
  const api = useApi();
  const items = ref<FinishedRoundDto[]>([]);
  const nextCursor = ref<number | null>(null);
  const pending = ref(false);

  async function load(reset = false) {
    pending.value = true;
    try {
      const page = await api<RoundsPageDto>(`/players/${encodeURIComponent(nickname.value)}/rounds`, {
        query: { limit: pageSize, cursor: reset ? undefined : (nextCursor.value ?? undefined) },
      });
      items.value = reset ? page.items : [...items.value, ...page.items];
      nextCursor.value = page.nextCursor;
    } finally {
      pending.value = false;
    }
  }

  watch(nickname, () => load(true));

  return { items, nextCursor, pending, load, loadMore: () => load(false) };
}
