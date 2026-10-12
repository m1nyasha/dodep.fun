import type { ActiveRoundResponseDto, RoundDto, RoundResponseDto } from '@dodep/shared';

export function useRound() {
  const api = useApi();
  const round = useState<RoundDto | null>('round', () => null);
  const live = computed(() => round.value?.status === 'active');

  async function call(path: string, body?: object) {
    const res = await api<RoundResponseDto>(path, { method: 'POST', body });
    round.value = res.round;
    return res;
  }

  async function restore() {
    const { round: active } = await api<ActiveRoundResponseDto>('/rounds/active');
    if (active) round.value = active;
  }

  return {
    round,
    live,
    restore,
    start: (bet: number) => call('/rounds', { bet }),
    open: (cell: number) => call(`/rounds/${round.value!.id}/open`, { cell }),
    cashOut: () => call(`/rounds/${round.value!.id}/cash-out`),
    reset: () => (round.value = null),
  };
}
