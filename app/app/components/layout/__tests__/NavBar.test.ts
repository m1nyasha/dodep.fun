// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMe } from '../../../composables/useMe';
import NavBar from '../NavBar.vue';

describe('NavBar', () => {
  beforeEach(() => {
    useMe().me.value = null;
  });

  it('hides Журнал for guests', async () => {
    const w = await mountSuspended(NavBar);
    expect(w.text()).not.toContain('Журнал');
  });

  it('shows Журнал once signed in, without remounting', async () => {
    const w = await mountSuspended(NavBar);
    expect(w.text()).not.toContain('Журнал');
    useMe().me.value = { nickname: 'kletka17' } as never;
    await w.vm.$nextTick();
    expect(w.text()).toContain('Журнал');
  });
});
