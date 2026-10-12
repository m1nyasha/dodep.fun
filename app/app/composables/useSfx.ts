export type SfxKind = 'tap' | 'start' | 'safe' | 'lose' | 'win' | 'coin';

type Note = [freq: number, delay: number, length: number, type?: OscillatorType];

const sequences = (up: number): Record<SfxKind, Note[]> => ({
  tap: [[660, 0, 0.05]],
  start: [
    [392, 0, 0.08],
    [523, 0.07, 0.12],
  ],
  safe: [
    [523 * up, 0, 0.1],
    [784 * up, 0.05, 0.14],
  ],
  lose: [
    [190, 0, 0.25, 'sawtooth'],
    [95, 0.08, 0.45, 'sawtooth'],
  ],
  win: [
    [523, 0, 0.12],
    [659, 0.08, 0.12],
    [784, 0.16, 0.14],
    [1047, 0.26, 0.32],
  ],
  coin: [
    [1568, 0, 0.04],
    [2093, 0.03, 0.07],
  ],
});

let ctx: AudioContext | undefined;

export function useSfx() {
  const enabled = useLocalStorage('dodep:sound', true);

  function play(kind: SfxKind, step = 0) {
    if (import.meta.server || !enabled.value) return;
    try {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
      const t = ctx.currentTime;
      const peak = kind === 'lose' ? 0.045 : kind === 'coin' ? 0.03 : 0.08;
      for (const [freq, delay, length, type = 'triangle'] of sequences(2 ** (step / 12))[kind]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t + delay);
        g.gain.setValueAtTime(0.0001, t + delay);
        g.gain.exponentialRampToValueAtTime(peak, t + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + length);
        o.connect(g).connect(ctx.destination);
        o.start(t + delay);
        o.stop(t + delay + length + 0.02);
      }
    } catch {
      // Браузер без WebAudio — играем молча.
    }
  }

  function toggle() {
    enabled.value = !enabled.value;
    play('tap');
  }

  return { enabled, play, toggle };
}
