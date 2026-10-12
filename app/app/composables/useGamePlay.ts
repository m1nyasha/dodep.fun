import { CELLS, multiplier, nextSafeChance, payout, SAFE, type FinishedRoundDto } from '@dodep/shared';

export interface StampView {
  kind: 'win' | 'loss';
  big: string;
  small: string;
}

export function useGamePlay() {
  const { me, isAuthed, refresh } = useMe();
  const { rules } = useRules();
  const game = useRound();
  const recent = useRecentRounds();
  const sfx = useSfx();
  const toast = useToast();
  const auth = useAuthModal();
  const daily = useDaily();
  const reduced = useReducedMotion();

  const bet = useLocalStorage('dodep:bet', 100);
  const busy = ref(false);
  const flipping = ref<number | null>(null);
  const stamp = ref<StampView | null>(null);
  const announce = ref('');
  const shake = useReplay(450);
  const nudge = useReplay(400);
  const pop = ref(0);

  const round = game.round;
  const live = game.live;
  const safe = computed(() => round.value?.safeCount ?? 0);
  const minBet = computed(() => rules.value?.minBet ?? 100);
  const step = computed(() => rules.value?.betStep ?? 100);
  const maxBet = computed(() => maxBetFor(me.value?.balance ?? 0, minBet.value, step.value));
  const rtp = computed(() => round.value?.rtp ?? rules.value?.rtp ?? 0.973);
  const finished = computed(() => (round.value && round.value.status !== 'active' ? round.value : null));
  const broke = computed(() => !live.value && isAuthed.value && (me.value?.balance ?? 0) < minBet.value);

  const ctaMode = computed(() => (broke.value ? 'broke' : !live.value ? 'play' : safe.value ? 'cash' : 'wait'));
  const ctaAmount = computed(() => {
    if (broke.value) return 0;
    if (!live.value) return bet.value;
    return safe.value ? payout(round.value!.bet, safe.value, rtp.value) : round.value!.bet;
  });
  const nextLabel = computed(() => (live.value && safe.value < SAFE ? fx(multiplier(safe.value + 1, rtp.value)) : ''));

  const readout = computed(() => {
    const shown = live.value || finished.value ? safe.value : 0;
    const m = live.value
      ? fx(multiplier(safe.value, rtp.value))
      : finished.value?.status === 'cashed_out'
        ? fx(finished.value.multiplier)
        : '—';
    return { opened: `${shown}/${SAFE}`, multiplier: m, chance: pct(nextSafeChance(live.value ? safe.value : 0)) };
  });

  const ladderState = computed(() => ({
    done: live.value || finished.value ? safe.value : 0,
    next: live.value ? safe.value + 1 : null,
    boom: finished.value?.status === 'hit_mine' ? safe.value + 1 : null,
  }));

  function finish(r: FinishedRoundDto) {
    recent.push(r);
    if (r.status === 'hit_mine') {
      shake.play();
      sfx.play('lose');
      navigator.vibrate?.([30, 40, 70]);
      stamp.value = { kind: 'loss', big: `−${fmt(r.bet)}`, small: `мина на ${r.safeCount + 1}-й клетке` };
      announce.value = `Мина на клетке ${(r.hitCell ?? 0) + 1}. Ставка ${fmt(r.bet)} сгорела.`;
      void refresh();
      return;
    }
    sfx.play('win');
    stamp.value = { kind: 'win', big: signed(r.net), small: `${fx(r.multiplier)} · ${cellsText(r.safeCount)}` };
    announce.value = `Забрано ${fmt(r.payout)} монет, множитель ${fx(r.multiplier)}.`;
    const cta = document.getElementById('cta');
    if (cta) flyCoins(cta, Math.min(18, 5 + r.safeCount * 2), () => sfx.play('coin'));
    setTimeout(() => void refresh(), reduced.value ? 0 : 780);
  }

  async function start() {
    if (busy.value || live.value) return;
    if (!isAuthed.value) return auth.open('register');
    if (broke.value) {
      nudge.play();
      toast.show('Монеты закончились', daily.text.value, 'bad');
      return;
    }
    busy.value = true;
    try {
      const res = await game.start(bet.value);
      if (me.value) me.value = { ...me.value, balance: res.balance };
      stamp.value = null;
      sfx.play('start');
      announce.value = `Раунд начат, ставка ${fmt(res.round.bet)}.`;
    } catch (e) {
      toast.show('Не удалось начать раунд', apiErrorMessage(e), 'bad');
    } finally {
      busy.value = false;
    }
  }

  async function open(cell: number, el?: HTMLElement) {
    if (!live.value) {
      nudge.play();
      return;
    }
    if (busy.value || round.value!.opened.includes(cell)) return;
    busy.value = true;
    flipping.value = cell;
    try {
      const [res] = await Promise.all([game.open(cell), wait(130)]);
      const r = res.round;
      if (r.status !== 'active') {
        finish(r);
        return;
      }
      sfx.play('safe', r.safeCount);
      if (el) burst(el, 6);
      navigator.vibrate?.(8);
      pop.value++;
      announce.value = `Клетка ${cell + 1}: безопасно. Множитель ${fx(r.multiplier)}, можно забрать ${fmt(r.potentialPayout)}.`;
    } catch (e) {
      toast.show('Ход не прошёл', apiErrorMessage(e), 'bad');
    } finally {
      flipping.value = null;
      busy.value = false;
    }
  }

  async function cashOut() {
    if (!live.value || busy.value || !safe.value) return;
    busy.value = true;
    try {
      const res = await game.cashOut();
      if (res.round.status !== 'active') finish(res.round);
    } catch (e) {
      toast.show('Не удалось забрать', apiErrorMessage(e), 'bad');
    } finally {
      busy.value = false;
    }
  }

  // ponytail: случайная клетка через остаток от деления — смещение ничтожно для ≤ 25 клеток; это выбор игрока, не исход.
  function randomCell() {
    if (!live.value) return;
    const free = Array.from({ length: CELLS }, (_, i) => i).filter((i) => !round.value!.opened.includes(i));
    const pick = free[crypto.getRandomValues(new Uint32Array(1))[0]! % free.length];
    if (pick === undefined) return;
    void open(pick, document.querySelector<HTMLElement>(`[data-cell="${pick}"]`) ?? undefined);
  }

  const press = () => void (live.value ? cashOut() : start());

  return {
    round,
    live,
    busy,
    flipping,
    stamp,
    announce,
    shake,
    pop,
    nudge,
    bet,
    minBet,
    step,
    maxBet,
    broke,
    ctaMode,
    ctaAmount,
    nextLabel,
    readout,
    ladderState,
    press,
    start,
    open,
    cashOut,
    randomCell,
  };
}
