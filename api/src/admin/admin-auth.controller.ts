import type { AdminMeDto } from '@dodep/shared';
import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import { CurrentUser } from '../auth/session.guard.js';
import { SessionsService } from '../auth/sessions.service.js';
import { apiError } from '../common/api-error.js';
import { DB, type Db } from '../db/db.module.js';
import { users, type UserRow } from '../db/schema.js';
import { ADMIN_COOKIE, ADMIN_SESSION_TTL, clearAdminCookie, setAdminCookie } from './admin-cookie.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { ticketSchema } from './admin.schemas.js';

@Controller('admin')
export class AdminAuthController {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly sessions: SessionsService,
  ) {}

  @Post('auth/exchange')
  @HttpCode(200)
  async exchange(
    @Body({ schema: ticketSchema }) body: z.infer<typeof ticketSchema>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminMeDto> {
    const userId = await this.sessions.consumeTicket(body.ticket);
    const [user] = userId ? await this.db.select().from(users).where(eq(users.id, userId)) : [];
    if (!user || !user.isAdmin || user.blockedAt)
      throw apiError(401, 'TICKET_INVALID', 'Ссылка устарела — нажмите «Админка» на сайте ещё раз');
    setAdminCookie(res, await this.sessions.create(user.id, 'admin', ADMIN_SESSION_TTL));
    return { nickname: user.nickname };
  }

  @Post('auth/logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token: unknown = req.cookies?.[ADMIN_COOKIE];
    if (typeof token === 'string') await this.sessions.revoke(token);
    clearAdminCookie(res);
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  @ApiCookieAuth('admin_sid')
  me(@CurrentUser() user: UserRow): AdminMeDto {
    return { nickname: user.nickname };
  }
}
