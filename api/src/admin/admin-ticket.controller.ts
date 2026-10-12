import type { AdminTicketDto } from '@dodep/shared';
import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { CurrentUser, SessionGuard } from '../auth/session.guard.js';
import { SessionsService } from '../auth/sessions.service.js';
import { apiError } from '../common/api-error.js';
import { config } from '../config.js';
import type { UserRow } from '../db/schema.js';
import { ADMIN_TICKET_TTL } from './admin-cookie.js';

@Controller('me')
@UseGuards(SessionGuard)
@ApiCookieAuth('sid')
export class AdminTicketController {
  constructor(private readonly sessions: SessionsService) {}

  @Post('admin-ticket')
  @HttpCode(200)
  async ticket(@CurrentUser() user: UserRow): Promise<AdminTicketDto> {
    if (!user.isAdmin || !config.adminUrl) throw apiError(403, 'ADMIN_ONLY', 'Раздел недоступен');
    const token = await this.sessions.create(user.id, 'admin_ticket', ADMIN_TICKET_TTL);
    return { url: `${config.adminUrl}/auth?ticket=${encodeURIComponent(token)}` };
  }
}
