// @vitest-environment nuxt
import type { FinishedRoundDto, RoundsPageDto } from '@dodep/shared';
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import ProfilePlayerRounds from '../ProfilePlayerRounds.vue';

const round = (roundNo: number): FinishedRoundDto => ({
  id: `r${roundNo}`,
  roundNo,
  bet: 100,
  hash: 'ab'.repeat(32),
  ruleVersion: 1,
  rtp: 0.973,
  opened: [10],
  safeCount: 1,
  startedAt: '2026-10-12T09:00:00.000Z',
  status: 'cashed_out',
  endReason: 'cash_out',
  multiplier: 1.2,
  payout: 120,
  net: 20,
  hitCell: null,
  mines: [0, 1, 2, 3, 4],
  salt: 'salt',
  finishedAt: '2026-10-12T09:01:00.000Z',
});

const queryOf = (event: { path?: string; url?: URL }) =>
  new URL(String(event.path ?? event.url), 'http://test').searchParams;

describe('ProfilePlayerRounds', () => {
  it('shows the finished rounds for the player and loads more on click', async () => {
    registerEndpoint('/api/players/watched/rounds', (event: { path?: string; url?: URL }): RoundsPageDto => {
      const cursor = queryOf(event).get('cursor');
      return cursor ? { items: [round(1)], nextCursor: null } : { items: [round(3), round(2)], nextCursor: 2 };
    });
    const w = await mountSuspended(ProfilePlayerRounds, { props: { nickname: 'watched' } });
    expect(w.text()).toContain('№3');
    expect(w.text()).toContain('№2');
    expect(w.text()).not.toContain('№1');

    await w.get('button.more').trigger('click');
    await vi.waitFor(() => expect(w.text()).toContain('№1'));
  });

  it('shows an empty state when there are no finished rounds', async () => {
    registerEndpoint('/api/players/empty/rounds', (): RoundsPageDto => ({ items: [], nextCursor: null }));
    const w = await mountSuspended(ProfilePlayerRounds, { props: { nickname: 'empty' } });
    expect(w.text()).toContain('Раундов пока нет');
  });
});
