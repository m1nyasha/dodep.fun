// @vitest-environment nuxt
import type { MeDto, PlayerDto } from '@dodep/shared';
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import ProfileStatusEditor from '../ProfileStatusEditor.vue';

const player = { nickname: 'northstar', humanRank: 2, isTop: true } as PlayerDto;
const me = { nickname: 'northstar', status: 'Старый', statusHidden: false } as MeDto;

describe('ProfileStatusEditor', () => {
  it('previews the cleaned text and counts characters', async () => {
    const w = await mountSuspended(ProfileStatusEditor, { props: { player, me } });
    await w.get('textarea').setValue('Выход   — тоже ход https://spam.io');
    expect(w.get('.counter').text()).toBe('34/72');
    expect(w.get('.preview').text()).toContain('«Выход — тоже ход»');
    expect(w.text()).toContain('топ-2');
  });

  it('publishes via PUT and emits saved', async () => {
    const handler = vi.fn(() => ({ ...me, status: 'Новый' }));
    registerEndpoint('/api/me/status', { method: 'PUT', handler });
    const w = await mountSuspended(ProfileStatusEditor, { props: { player, me } });
    await w.get('textarea').setValue('Новый');
    await w.get('form').trigger('submit');
    await vi.waitFor(() => expect(w.emitted('saved')).toHaveLength(1));
    expect(handler).toHaveBeenCalledOnce();
    expect((w.get('textarea').element as HTMLTextAreaElement).value).toBe('Новый');
  });

  it('warns when a moderator hid the status', async () => {
    const w = await mountSuspended(ProfileStatusEditor, { props: { player, me: { ...me, statusHidden: true } } });
    expect(w.text()).toContain('Модератор скрыл статус');
  });
});
