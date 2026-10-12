import type { DailyClaimDto } from '@dodep/shared';

const duration = (ms: number) => {
  const m = Math.ceil(ms / 60_000);
  const h = Math.floor(m / 60);
  return h ? `${h} ч ${m % 60} мин` : `${m} мин`;
};

export function useDaily() {
  const { me } = useMe();
  const { round } = useRound();
  const api = useApi();
  const toast = useToast();
  const sfx = useSfx();
  const now = useNow({ scheduler: (cb) => useIntervalFn(cb, 30_000) });

  const available = computed(
    () =>
      !!me.value &&
      round.value?.status !== 'active' &&
      me.value.balance < me.value.dailyTarget &&
      now.value.getTime() >= Date.parse(me.value.nextDailyAt),
  );

  const text = computed(() => {
    const m = me.value;
    if (!m) return `После входа — до ${fmt(10_000)} монет каждый день в 12:00 МСК.`;
    if (m.balance >= m.dailyTarget) return `Откроется, когда баланс опустится ниже ${fmt(m.dailyTarget)}.`;
    if (available.value) return `Можно добрать ${fmt(m.dailyTarget - m.balance)} монет.`;
    return `Следующая выдача через ${duration(Date.parse(m.nextDailyAt) - now.value.getTime())}.`;
  });

  async function claim(el?: HTMLElement) {
    try {
      const res = await api<DailyClaimDto>('/me/daily', { method: 'POST' });
      if (me.value) me.value = { ...me.value, balance: res.balance, nextDailyAt: res.nextDailyAt };
      if (el) burst(el, 10);
      sfx.play('win');
      toast.show('Баланс пополнен', `+${fmt(res.added)} монет — снова ${fmt(res.balance)}.`, 'good');
    } catch (e) {
      toast.show('Не получилось', apiErrorMessage(e), 'bad');
    }
  }

  return { available, text, claim };
}
