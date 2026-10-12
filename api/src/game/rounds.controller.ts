import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import type { z } from 'zod';
import { CurrentUser, SessionGuard } from '../auth/session.guard.js';
import type { UserRow } from '../db/schema.js';
import { listSchema, openSchema, roundIdSchema, startSchema } from './rounds.schemas.js';
import { RoundsService } from './rounds.service.js';

@Controller('rounds')
@UseGuards(SessionGuard)
@ApiCookieAuth('sid')
export class RoundsController {
  constructor(private readonly rounds: RoundsService) {}

  @Post()
  start(@CurrentUser() user: UserRow, @Body({ schema: startSchema }) body: z.infer<typeof startSchema>) {
    return this.rounds.start(user.id, body.bet);
  }

  @Get('active')
  active(@CurrentUser() user: UserRow) {
    return this.rounds.active(user.id);
  }

  @Get()
  list(@CurrentUser() user: UserRow, @Query({ schema: listSchema }) query: z.infer<typeof listSchema>) {
    return this.rounds.list(user.id, query.cursor, query.limit);
  }

  @Post(':id/open')
  @HttpCode(200)
  open(
    @CurrentUser() user: UserRow,
    @Param('id', { schema: roundIdSchema }) id: string,
    @Body({ schema: openSchema }) body: z.infer<typeof openSchema>,
  ) {
    return this.rounds.open(user, id, body.cell);
  }

  @Post(':id/cash-out')
  @HttpCode(200)
  cashOut(@CurrentUser() user: UserRow, @Param('id', { schema: roundIdSchema }) id: string) {
    return this.rounds.cashOut(user, id);
  }
}
