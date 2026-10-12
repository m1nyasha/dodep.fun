import { type CanActivate, createParamDecorator, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { apiError } from '../common/api-error.js';
import type { UserRow } from '../db/schema.js';
import { SESSION_COOKIE } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    const user = typeof token === 'string' ? await this.sessions.findUser(token, 'user') : null;
    if (!user || user.blockedAt) throw apiError(401, 'UNAUTHORIZED', 'Нужно войти');
    req.user = user;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  // Guaranteed by SessionGuard, which runs first and populates req.user or throws.
  (_: unknown, ctx: ExecutionContext): UserRow => ctx.switchToHttp().getRequest<Request>().user as UserRow,
);
