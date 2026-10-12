import type { Response } from 'express';
import { config } from '../config.js';

export const ADMIN_COOKIE = 'admin_sid';
export const ADMIN_SESSION_TTL = 12 * 3_600_000;
export const ADMIN_TICKET_TTL = 60_000;

const options = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'strict' as const,
  path: '/api/admin',
});

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(ADMIN_COOKIE, token, { ...options(), maxAge: ADMIN_SESSION_TTL });
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, options());
}
