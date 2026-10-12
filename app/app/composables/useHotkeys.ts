export function useHotkeys(handlers: { space?: () => void; r?: () => void }) {
  useEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (target?.closest('input, textarea, select, a') || document.querySelector('[aria-modal="true"]')) return;
    if (e.code === 'Space') {
      if (target?.closest('button') && !target.closest('[data-hotkey="space"]')) return;
      e.preventDefault();
      if (!e.repeat) handlers.space?.();
    } else if (e.code === 'KeyR' && !e.repeat) {
      handlers.r?.();
    }
  });
}
