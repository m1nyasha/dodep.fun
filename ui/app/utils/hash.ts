export function fnv1a(s: string): number {
  let h = 2_166_136_261;
  for (const ch of s) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}
