import { timingSafeEqual } from 'node:crypto';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { apiError } from '../common/api-error.js';
import { config } from '../config.js';

@Injectable()
export class AgentTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!config.agentApiEnabled) throw apiError(404, 'UNAUTHORIZED', 'Маршрут недоступен');
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('authorization');
    const provided = header?.startsWith('Bearer ') ? header.slice(7) : '';
    const expected = Buffer.from(config.agentApiToken);
    const actual = Buffer.from(provided);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw apiError(401, 'UNAUTHORIZED', 'Неверный токен');
    return true;
  }
}
