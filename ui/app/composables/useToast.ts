export interface Toast {
  id: number;
  title: string;
  detail?: string;
  tone?: 'good' | 'bad';
}

let seq = 0;

export function useToast() {
  const toasts = useState<Toast[]>('ui-toasts', () => []);

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function show(title: string, detail?: string, tone?: 'good' | 'bad') {
    const id = ++seq;
    toasts.value = [...toasts.value, { id, title, detail, tone }].slice(-3);
    if (import.meta.client) setTimeout(() => dismiss(id), 3_400);
  }

  return { toasts, show, dismiss };
}
