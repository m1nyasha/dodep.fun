/** Only ever redirect to a path on this site — never to an attacker-controlled external URL. */
export function safeRedirect(path: unknown, fallback = '/'): string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return fallback;
  }
  return path;
}

export const loginRedirectTo = (path: string): string => `/auth?redirect=${encodeURIComponent(path)}`;
