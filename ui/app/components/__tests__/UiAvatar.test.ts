import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import UiAvatar from '../UiAvatar.vue';

describe('UiAvatar', () => {
  it('is deterministic for a name and mirrors columns', async () => {
    const a = await mountSuspended(UiAvatar, { props: { name: 'kletka17' } });
    const b = await mountSuspended(UiAvatar, { props: { name: 'kletka17' } });
    expect(a.html()).toBe(b.html());
    const xs = a.findAll('rect').map((r) => Number(r.attributes('x')));
    expect(xs.every((x) => x >= 0 && x <= 4)).toBe(true);
    expect(xs.filter((x) => x === 0).length).toBe(xs.filter((x) => x === 4).length);
  });

  it('applies kind and size', async () => {
    const w = await mountSuspended(UiAvatar, { props: { name: 'Рисковый #01', kind: 'ai', size: 48 } });
    expect(w.get('span').classes()).toContain('ai');
    expect(w.get('span').attributes('style')).toContain('--s: 48px');
  });
});
