import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToast().toasts.value = [];
  });
  afterEach(() => vi.useRealTimers());

  it('keeps at most three toasts, newest last', () => {
    const { show, toasts } = useToast();
    for (const n of [1, 2, 3, 4]) show(`t${n}`);
    expect(toasts.value.map((t) => t.title)).toEqual(['t2', 't3', 't4']);
  });

  it('hides a toast after 3.4 s', () => {
    const { show, toasts } = useToast();
    show('Баланс пополнен', '+9 700', 'good');
    expect(toasts.value[0]).toMatchObject({ title: 'Баланс пополнен', detail: '+9 700', tone: 'good' });
    vi.advanceTimersByTime(3_400);
    expect(toasts.value).toHaveLength(0);
  });
});
