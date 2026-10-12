import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import type { z } from 'zod';
import { CurrentUser } from '../auth/session.guard.js';
import type { UserRow } from '../db/schema.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { optionalReasonSchema, ruleSchema } from './admin.schemas.js';
import { RulesAdminService } from './rules-admin.service.js';

@Controller('admin/rules')
@UseGuards(AdminSessionGuard)
@ApiCookieAuth('admin_sid')
export class RulesAdminController {
  constructor(private readonly rules: RulesAdminService) {}

  @Get()
  list() {
    return this.rules.list();
  }

  @Post()
  create(@CurrentUser() admin: UserRow, @Body({ schema: ruleSchema }) body: z.infer<typeof ruleSchema>) {
    return this.rules.create(admin, body);
  }

  @Post(':version/activate')
  @HttpCode(200)
  activate(
    @CurrentUser() admin: UserRow,
    @Param('version', ParseIntPipe) version: number,
    @Body({ schema: optionalReasonSchema }) body: z.infer<typeof optionalReasonSchema>,
  ) {
    return this.rules.activate(admin, version, body.reason);
  }
}
