// @vitest-environment nuxt
import type { FinishedRoundDto } from '@dodep/shared';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import JournalRow from '../JournalRow.vue';

const { verifyMock } = vi.hoisted(() => ({ verifyMock: vi.fn(async () => true) }));
mockNuxtImport('verifyRound', () => verifyMock);

const round: FinishedRoundDto = {
  id: '0192f0a0-0000-7000-8000-000000000001',
  roundNo: 7,
  bet: 500,
  hash: 'ab'.repeat(32),
  ruleVersion: 1,
  rtp: 0.973,
  opened: [10, 11],
  safeCount: 2,
  startedAt: '2026-10-12T10:00:00.000Z',
  status: 'cashed_out',
  endReason: 'cash_out',
  multiplier: 1.536316,
  payout: 768,
  net: 268,
  hitCell: null,
  mines: [0, 1, 2, 3, 4],
  salt: 'c0ffee',
  finishedAt: '2026-10-12T10:00:05.000Z',
};

describe('JournalRow', () => {
  it('shows the summary and reveals verification details when open', async () => {
    const w = await mountSuspended(JournalRow, { props: { round, open: true } });
    expect(w.get('details').attributes('id')).toBe(round.id);
    expect(w.text()).toContain('№7');
    expect(w.text()).toContain('1, 2, 3, 4, 5');
    expect(w.text()).toContain('c0ffee');
    expect(w.text()).toContain('v1');
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.text()).toContain('Совпадает с хэшем'));
    expect(verifyMock).toHaveBeenCalledWith(round.mines, round.salt, round.hash);
  });

  it('does not render the body while closed', async () => {
    const w = await mountSuspended(JournalRow, { props: { round, open: false } });
    expect(w.find('.verify').exists()).toBe(false);
  });

  it('reports a mismatch', async () => {
    verifyMock.mockResolvedValueOnce(false);
    const w = await mountSuspended(JournalRow, { props: { round, open: true } });
    await w.get('button').trigger('click');
    await vi.waitFor(() => expect(w.text()).toContain('Не совпадает'));
  });
});
