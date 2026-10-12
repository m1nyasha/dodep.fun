import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SessionsService } from '../auth/sessions.service.js';
import { apiError } from '../common/api-error.js';
import type { UserRow } from '../db/schema.js';
import { ADMIN_COOKIE } from './admin-cookie.js';

export async function resolveAdmin(sessions: SessionsService, token: unknown): Promise<UserRow | null> {
  if (typeof token !== 'string') return null;
  const user = await sessions.findUser(token, 'admin');
  return user && user.isAdmin && !user.blockedAt ? user : null;
}

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = await resolveAdmin(this.sessions, req.cookies?.[ADMIN_COOKIE]);
    if (!user) throw apiError(401, 'UNAUTHORIZED', 'Нужно войти в админку');
    req.user = user;
    return true;
  }
}
