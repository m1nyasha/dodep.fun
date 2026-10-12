import type { Request } from 'express';

export interface Fingerprint {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  clientHash: string | null;
}

export function normalizeIp(ip: string | undefined): string {
  if (!ip) return '0.0.0.0';
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

export function fingerprintFromRequest(req: Request, clientHash?: string): Fingerprint {
  return {
    ip: normalizeIp(req.ip),
    userAgent: (req.get('user-agent') ?? '').slice(0, 512),
    acceptLanguage: (req.get('accept-language') ?? '').slice(0, 255),
    clientHash: clientHash ?? null,
  };
}
