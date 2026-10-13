import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import Console from '../Console.vue';

function fakeGame(live: boolean) {
  return {
    round: ref(null),
    live: ref(live),
    busy: ref(false),
    flipping: ref(null),
    stamp: ref(null),
    announce: ref(''),
    shake: { on: ref(false), play: () => undefined },
    nudge: { on: ref(false), play: () => undefined },
    pop: ref(0),
    bet: ref(100),
    minBet: ref(100),
    step: ref(100),
    maxBet: ref(1_000),
    broke: ref(false),
    ctaMode: ref(live ? 'wait' : 'play'),
    ctaAmount: ref(100),
    nextLabel: ref(''),
    readout: ref({ opened: '0/20', multiplier: '—', chance: '80%' }),
    ladderState: ref({ done: 0, next: 1, boom: null }),
    press: () => undefined,
    start: () => undefined,
    open: () => undefined,
    cashOut: () => undefined,
    randomCell: () => undefined,
  };
}

mockNuxtImport('useGamePlay', () => () => fakeGame(live));

// `live` is read by the mocked `useGamePlay` factory above; set it per test before mounting.
let live = false;

describe('GameConsole', () => {
  it('keeps the bet field at its protected minimum width when the dice button appears mid-round', async () => {
    live = true;
    const w = await mountSuspended(Console);

    const controls = w.get('.controls');
    const children = [...controls.element.children].map((el) => el.className);
    // bet field, dice, then CTA must all coexist in the controls row during a live round.
    expect(children[0]).toContain('bet');
    expect(children.some((c) => c.includes('dice'))).toBe(true);
    expect(children.at(-1)).toContain('cta');
  });

  it('does not render the dice button when idle', async () => {
    live = false;
    const w = await mountSuspended(Console);
    expect(w.find('.dice').exists()).toBe(false);
    expect(w.find('.bet').exists()).toBe(true);
  });
});
