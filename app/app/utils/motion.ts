const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, reduced() ? 0 : ms));

export function burst(el: HTMLElement, n = 7): void {
  if (reduced()) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'particle';
    document.body.append(p);
    const a = ((Math.PI * 2) / n) * i + Math.random() * 0.6;
    const d = Math.max(30, r.width) * (0.55 + Math.random() * 0.5);
    p.animate(
      [
        { transform: `translate(${cx}px,${cy}px) rotate(0) scale(1)`, opacity: 1 },
        {
          transform: `translate(${cx + Math.cos(a) * d}px,${cy + Math.sin(a) * d}px) rotate(${Math.random() * 220}deg) scale(.2)`,
          opacity: 0,
        },
      ],
      { duration: 520 + Math.random() * 220, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ).finished.then(() => p.remove());
  }
}

export function flyCoins(from: HTMLElement, n: number, onLand?: () => void): void {
  const to = document.getElementById('wallet');
  if (reduced() || !to) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const tx = b.left + 22;
  const ty = b.top + b.height / 2;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'ui-coin fly';
    document.body.append(c);
    const sx = a.left + a.width / 2 + (Math.random() - 0.5) * a.width * 0.7;
    const sy = a.top + a.height / 2 + (Math.random() - 0.5) * 20;
    const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 260;
    const my = Math.min(sy, ty) - 60 - Math.random() * 140;
    c.animate(
      [
        { transform: `translate(${sx}px,${sy}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${sx}px,${sy - 26}px) scale(1.15)`, opacity: 1, offset: 0.14 },
        { transform: `translate(${mx}px,${my}px) scale(1)`, offset: 0.55 },
        { transform: `translate(${tx}px,${ty}px) scale(.55)`, opacity: 1 },
      ],
      { duration: 720 + Math.random() * 260, delay: i * 42, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' },
    ).finished.then(() => {
      c.remove();
      if (i % 3 === 0) onLand?.();
    });
  }
}
