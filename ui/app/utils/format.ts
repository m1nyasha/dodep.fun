const nf = new Intl.NumberFormat('ru-RU');
const TZ = 'Europe/Moscow';

export const fmt = (n: number) => nf.format(Math.round(Number(n) || 0));

export const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));

export const fx = (x: number) => (x < 100 ? x.toFixed(2) : x < 1000 ? x.toFixed(1) : fmt(x)).replace('.', ',') + '×';

export function pct(p: number): string {
  const v = p * 100;
  const s = v >= 10 ? String(Math.round(v * 10) / 10) : v >= 1 ? v.toFixed(1) : v.toPrecision(2);
  return s.replace('.', ',') + '%';
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m = Math.abs(n) % 10;
  const h = Math.abs(n) % 100;
  if (m === 1 && h !== 11) return one;
  if (m >= 2 && m <= 4 && (h < 12 || h > 14)) return few;
  return many;
}

export function ago(date: string | Date, now = Date.now()): string {
  const s = (now - new Date(date).getTime()) / 1000;
  if (s < 60) return 'только что';
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86_400) return `${Math.floor(s / 3600)} ч назад`;
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: TZ });
}

export const stamp = (date: string | Date) =>
  new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
