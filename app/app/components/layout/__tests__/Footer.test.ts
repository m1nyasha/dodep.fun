// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMe } from '../../../composables/useMe';
import Footer from '../Footer.vue';

describe('Footer', () => {
  beforeEach(() => {
    useMe().me.value = null;
  });

  it('hides the journal link for guests', async () => {
    const w = await mountSuspended(Footer);
    expect(w.text()).not.toContain('Проверка раундов');
  });

  it('shows the journal link once signed in, without remounting', async () => {
    const w = await mountSuspended(Footer);
    useMe().me.value = { nickname: 'kletka17' } as never;
    await w.vm.$nextTick();
    expect(w.text()).toContain('Проверка раундов');
  });
});
