import type { LeaderboardDto, PlayerDto } from '@dodep/shared';

export function useLeaderboard(filter: Ref<string>, query: Ref<string>, pageSize = 15) {
  const api = useApi();
  const items = useState<PlayerDto[]>('leaderboard:items', () => []);
  const total = useState('leaderboard:total', () => 0);
  const pending = ref(false);
  let ticket = 0;

  async function load(reset: boolean) {
    const mine = ++ticket;
    pending.value = true;
    try {
      const page = await api<LeaderboardDto>('/leaderboard', {
        query: {
          filter: filter.value,
          q: query.value.trim() || undefined,
          offset: reset ? 0 : items.value.length,
          limit: reset ? pageSize : 25,
        },
      });
      if (mine !== ticket) return;
      items.value = reset ? page.items : [...items.value, ...page.items];
      total.value = page.total;
    } finally {
      if (mine === ticket) pending.value = false;
    }
  }

  watch(filter, () => load(true));
  watchDebounced(query, () => load(true), { debounce: 250 });

  return {
    items,
    total,
    pending,
    more: computed(() => Math.max(0, total.value - items.value.length)),
    load,
    loadMore: () => load(false),
  };
}
