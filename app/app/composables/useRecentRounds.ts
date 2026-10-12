import type { FinishedRoundDto, RoundsPageDto } from '@dodep/shared';

const SIZE = 6;

export function useRecentRounds() {
  const api = useApi();
  const items = useState<FinishedRoundDto[]>('recent-rounds', () => []);

  return {
    items,
    async load() {
      items.value = (await api<RoundsPageDto>('/rounds', { query: { limit: SIZE } })).items;
    },
    push(round: FinishedRoundDto) {
      items.value = [round, ...items.value.filter((r) => r.id !== round.id)].slice(0, SIZE);
    },
  };
}
