import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser } from '../auth/session.guard.js';
import type { UserRow } from '../db/schema.js';
import { AccountsService } from './accounts.service.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { pageSchema, reasonSchema } from './admin.schemas.js';

const accountsQuery = pageSchema.extend({ q: z.string().trim().max(20).optional() });
type Reason = z.infer<typeof reasonSchema>;

@Controller('admin')
@UseGuards(AdminSessionGuard)
@ApiCookieAuth('admin_sid')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get('accounts')
  list(@Query({ schema: accountsQuery }) query: z.infer<typeof accountsQuery>) {
    return this.accounts.list(query.q, query.offset, query.limit);
  }

  @Get('accounts/:nickname')
  detail(@Param('nickname') nickname: string) {
    return this.accounts.detail(nickname);
  }

  @Post('accounts/:nickname/block')
  @HttpCode(200)
  block(
    @CurrentUser() admin: UserRow,
    @Param('nickname') nickname: string,
    @Body({ schema: reasonSchema }) body: Reason,
  ) {
    return this.accounts.setBlocked(admin, nickname, true, body.reason);
  }

  @Post('accounts/:nickname/unblock')
  @HttpCode(200)
  unblock(
    @CurrentUser() admin: UserRow,
    @Param('nickname') nickname: string,
    @Body({ schema: reasonSchema }) body: Reason,
  ) {
    return this.accounts.setBlocked(admin, nickname, false, body.reason);
  }

  @Get('statuses')
  statuses() {
    return this.accounts.statuses();
  }

  @Post('statuses/:nickname/hide')
  @HttpCode(200)
  hide(
    @CurrentUser() admin: UserRow,
    @Param('nickname') nickname: string,
    @Body({ schema: reasonSchema }) body: Reason,
  ) {
    return this.accounts.setStatusHidden(admin, nickname, true, body.reason);
  }

  @Post('statuses/:nickname/show')
  @HttpCode(200)
  show(
    @CurrentUser() admin: UserRow,
    @Param('nickname') nickname: string,
    @Body({ schema: reasonSchema }) body: Reason,
  ) {
    return this.accounts.setStatusHidden(admin, nickname, false, body.reason);
  }
}
