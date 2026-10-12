import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, SessionGuard } from '../auth/session.guard.js';
import type { UserRow } from '../db/schema.js';
import { MeService } from './me.service.js';

const statusSchema = z.object({ text: z.string().max(500) });

@Controller('me')
@UseGuards(SessionGuard)
@ApiCookieAuth('sid')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  get(@CurrentUser() user: UserRow) {
    return this.me.get(user);
  }

  @Post('daily')
  @HttpCode(200)
  daily(@CurrentUser() user: UserRow) {
    return this.me.claimDaily(user.id);
  }

  @Put('status')
  status(@CurrentUser() user: UserRow, @Body({ schema: statusSchema }) body: z.infer<typeof statusSchema>) {
    return this.me.setStatus(user, body.text);
  }
}
