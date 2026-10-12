import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Db, type Tx } from '../db/db.module.js';
import { ruleVersions, type RuleRow } from '../db/schema.js';

@Injectable()
export class RulesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async active(tx: Db | Tx = this.db): Promise<RuleRow> {
    const [rule] = await tx.select().from(ruleVersions).where(eq(ruleVersions.isActive, true));
    if (!rule) throw new Error('No active rule version');
    return rule;
  }

  async byId(id: string, tx: Db | Tx = this.db): Promise<RuleRow> {
    const [rule] = await tx.select().from(ruleVersions).where(eq(ruleVersions.id, id));
    if (!rule) throw new Error(`Rule version ${id} not found`);
    return rule;
  }
}
