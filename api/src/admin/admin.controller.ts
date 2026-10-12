import type { AdminOverviewDto, RegistrationLimitDto } from '@dodep/shared';
import { Body, Controller, Get, Inject, Put, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import type { z } from 'zod';
import { CurrentUser } from '../auth/session.guard.js';
import { parseRegistrationLimit } from '../auth/registration-limit.js';
import { DB, type Db } from '../db/db.module.js';
import { rounds, settings, users, type UserRow } from '../db/schema.js';
import { RulesService } from '../game/rules.service.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { limitSchema, pageSchema } from './admin.schemas.js';
import { AuditService } from './audit.service.js';

@Controller('admin')
@UseGuards(AdminSessionGuard)
@ApiCookieAuth('admin_sid')
export class AdminController {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly audit: AuditService,
    private readonly rules: RulesService,
  ) {}

  @Get('overview')
  async overview(): Promise<AdminOverviewDto> {
    const n = (rows: { n: number }[]) => rows[0]?.n ?? 0;
    const [accounts, ai, blocked, hidden, played, rule, recent] = await Promise.all([
      this.db.select({ n: count() }).from(users),
      this.db.select({ n: count() }).from(users).where(eq(users.isAi, true)),
      this.db.select({ n: count() }).from(users).where(isNotNull(users.blockedAt)),
      this.db
        .select({ n: count() })
        .from(users)
        .where(and(isNotNull(users.statusText), isNotNull(users.statusHiddenAt))),
      this.db.select({ n: count() }).from(rounds),
      this.rules.active(),
      this.audit.list(0, 5),
    ]);
    return {
      accounts: n(accounts),
      aiAccounts: n(ai),
      blocked: n(blocked),
      hiddenStatuses: n(hidden),
      rounds: n(played),
      activeRuleVersion: rule.version,
      recentActions: recent.items,
    };
  }

  @Get('audit')
  auditLog(@Query({ schema: pageSchema }) query: z.infer<typeof pageSchema>) {
    return this.audit.list(query.offset, query.limit);
  }

  @Get('settings/registration-limit')
  async registrationLimit(): Promise<RegistrationLimitDto> {
    const [row] = await this.db.select().from(settings).where(eq(settings.key, 'registration_limit'));
    return parseRegistrationLimit(row?.value);
  }

  @Put('settings/registration-limit')
  async setRegistrationLimit(
    @CurrentUser() admin: UserRow,
    @Body({ schema: limitSchema }) body: z.infer<typeof limitSchema>,
  ): Promise<RegistrationLimitDto> {
    const value = { count: body.count, windowHours: body.windowHours };
    await this.db.transaction(async (tx) => {
      await tx
        .insert(settings)
        .values({ key: 'registration_limit', value })
        .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
      await this.audit.log(tx, { adminId: admin.id, action: 'settings_update', payload: value, reason: body.reason });
    });
    return value;
  }
}
