import type { RuleVersionDto, RuleVersionInput } from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { apiError } from '../common/api-error.js';
import { DB, type Db } from '../db/db.module.js';
import { ruleVersions, users, type UserRow } from '../db/schema.js';
import { AuditService } from './audit.service.js';

@Injectable()
export class RulesAdminService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<RuleVersionDto[]> {
    const rows = await this.db
      .select({ rule: ruleVersions, createdBy: users.nickname })
      .from(ruleVersions)
      .leftJoin(users, eq(users.id, ruleVersions.createdBy))
      .orderBy(desc(ruleVersions.version));
    return rows.map(({ rule, createdBy }) => ({
      version: rule.version,
      rtp: rule.rtp,
      minBet: rule.minBet,
      betStep: rule.betStep,
      startBalance: rule.startBalance,
      dailyTarget: rule.dailyTarget,
      isActive: rule.isActive,
      createdBy,
      createdAt: rule.createdAt.toISOString(),
    }));
  }

  async create(admin: UserRow, input: RuleVersionInput): Promise<RuleVersionDto> {
    const { reason, ...fields } = input;
    const version = await this.db.transaction(async (tx) => {
      // Lock the existing rows (and the gap after the last one) before computing max+1, so
      // concurrent creates serialize instead of both computing the same next version.
      const locked = await tx.select({ v: ruleVersions.version }).from(ruleVersions).for('update');
      const next = locked.reduce((max, r) => Math.max(max, r.v), 0) + 1;
      await tx.insert(ruleVersions).values({ ...fields, version: next, isActive: false, createdBy: admin.id });
      await this.audit.log(tx, {
        adminId: admin.id,
        action: 'rules_create',
        payload: { version: next, ...fields },
        reason,
      });
      return next;
    });
    return this.byVersion(version);
  }

  async activate(admin: UserRow, version: number, reason?: string): Promise<RuleVersionDto> {
    await this.db.transaction(async (tx) => {
      // Lock every row up front so two concurrent activations serialize instead of racing the
      // active unique index (one would otherwise read stale isActive state after the other commits).
      const rows = await tx.select().from(ruleVersions).for('update');
      const target = rows.find((r) => r.version === version);
      if (!target) throw apiError(404, 'RULE_NOT_FOUND', `Версии v${version} нет`);
      if (target.isActive) return;
      await tx.update(ruleVersions).set({ isActive: false }).where(eq(ruleVersions.isActive, true));
      await tx.update(ruleVersions).set({ isActive: true }).where(eq(ruleVersions.id, target.id));
      await this.audit.log(tx, { adminId: admin.id, action: 'rules_activate', payload: { version }, reason });
    });
    return this.byVersion(version);
  }

  private async byVersion(version: number): Promise<RuleVersionDto> {
    const found = (await this.list()).find((r) => r.version === version);
    if (!found) throw apiError(404, 'RULE_NOT_FOUND', `Версии v${version} нет`);
    return found;
  }
}
