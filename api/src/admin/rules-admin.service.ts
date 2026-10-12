import type { RuleVersionDto, RuleVersionInput } from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, max } from 'drizzle-orm';
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
      const [top] = await tx.select({ v: max(ruleVersions.version) }).from(ruleVersions);
      const next = (top?.v ?? 0) + 1;
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
      const [target] = await tx.select().from(ruleVersions).where(eq(ruleVersions.version, version)).for('update');
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
