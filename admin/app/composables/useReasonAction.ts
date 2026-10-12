export interface ReasonTarget {
  path: string;
  method?: 'POST' | 'PUT';
  title: string;
  confirmLabel: string;
  description: string;
  done: string;
  danger?: boolean;
  optional?: boolean;
}

export function useReasonAction() {
  const api = useApi();
  const toast = useToast();
  const target = ref<ReasonTarget | null>(null);
  const open = computed({
    get: () => target.value !== null,
    set: (value: boolean) => {
      if (!value) target.value = null;
    },
  });

  async function run(reason: string) {
    const current = target.value;
    if (!current) return;
    try {
      await api(current.path, { method: current.method ?? 'POST', body: { reason } });
      toast.show(current.done, 'Записано в историю.', 'good');
      target.value = null;
      await refreshNuxtData();
    } catch (e) {
      toast.show('Не получилось', apiErrorMessage(e), 'bad');
    }
  }

  return { target, open, ask: (t: ReasonTarget) => (target.value = t), run };
}
