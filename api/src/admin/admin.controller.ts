import type { AdminOverviewDto } from '@dodep/shared';
import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import type { z } from 'zod';
import { DB, type Db } from '../db/db.module.js';
import { rounds, users } from '../db/schema.js';
import { RulesService } from '../game/rules.service.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { pageSchema } from './admin.schemas.js';
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
}
