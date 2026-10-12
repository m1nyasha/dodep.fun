import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { CurrentUser, SessionGuard } from '../auth/session.guard.js';
import type { UserRow } from '../db/schema.js';
import { MeService } from './me.service.js';

@Controller('me')
@UseGuards(SessionGuard)
@ApiCookieAuth('sid')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  get(@CurrentUser() user: UserRow) {
    return this.me.get(user);
  }
}
