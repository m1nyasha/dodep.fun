import type { FinishedRoundDto, RoundsPageDto } from '@dodep/shared';

export function useJournal(pageSize = 20) {
  const api = useApi();
  const items = useState<FinishedRoundDto[]>('journal:items', () => []);
  const nextCursor = useState<number | null>('journal:cursor', () => null);
  const pending = ref(false);

  async function load(reset = false) {
    pending.value = true;
    try {
      const page = await api<RoundsPageDto>('/rounds', {
        query: { limit: pageSize, cursor: reset ? undefined : (nextCursor.value ?? undefined) },
      });
      items.value = reset ? page.items : [...items.value, ...page.items];
      nextCursor.value = page.nextCursor;
    } finally {
      pending.value = false;
    }
  }

  return { items, nextCursor, pending, load, loadMore: () => load(false) };
}
