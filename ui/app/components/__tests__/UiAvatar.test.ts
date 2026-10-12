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

  it('centers the drawn rows vertically without changing the pixel scale', async () => {
    for (const name of ['mikhal', 'smoketest2', 'task9check', 'avacheck6080', 'proto13test', 'kletka17']) {
      const w = await mountSuspended(UiAvatar, { props: { name } });
      const [, y0, width, height] = w.get('svg').attributes('viewBox')!.split(' ').map(Number);
      const ys = w.findAll('rect').map((r) => Number(r.attributes('y')));
      const contentCenter = (Math.min(...ys) + Math.max(...ys) + 1) / 2;
      expect([width, height]).toEqual([6, 6]);
      expect(contentCenter).toBeCloseTo(y0! + height! / 2, 6);
    }
  });

  it('applies kind and size', async () => {
    const w = await mountSuspended(UiAvatar, { props: { name: 'Рисковый #01', kind: 'ai', size: 48 } });
    expect(w.get('span').classes()).toContain('ai');
    expect(w.get('span').attributes('style')).toContain('--s: 48px');
  });
});
