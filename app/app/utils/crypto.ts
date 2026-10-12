import { layoutString } from '@dodep/shared';

export async function sha256Hex(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyRound(mines: number[], salt: string, hash: string): Promise<boolean> {
  const actual = await sha256Hex(layoutString(mines, salt));
  return actual !== '' && actual === hash;
}

let cachedHash: Promise<string> | undefined;

// The fingerprint inputs (tz/screen/langs/platform/cores) are stable for the whole
// session, so hash them once and reuse the promise instead of re-hitting WebCrypto
// on every login/register submit.
export function clientHash(): Promise<string> {
  return (cachedHash ??= sha256Hex(
    JSON.stringify({
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      langs: [...navigator.languages],
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
    }),
  ));
}
