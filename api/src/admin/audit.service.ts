import type { AdminActionDto, AdminActionKind, AdminActionsPageDto } from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DB, type Db, type Tx } from '../db/db.module.js';
import { adminActions, users } from '../db/schema.js';

export interface AuditEntry {
  adminId: string;
  action: AdminActionKind;
  targetUserId?: string | null;
  payload?: unknown;
  reason?: string | null;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async log(tx: Db | Tx, entry: AuditEntry): Promise<void> {
    await tx.insert(adminActions).values({
      adminId: entry.adminId,
      action: entry.action,
      targetUserId: entry.targetUserId ?? null,
      payload: entry.payload ?? null,
      reason: entry.reason || null,
    });
  }

  async list(offset: number, limit: number): Promise<AdminActionsPageDto> {
    const admin = alias(users, 'admin');
    const target = alias(users, 'target');
    const [rows, [total]] = await Promise.all([
      this.db
        .select({
          id: adminActions.id,
          action: adminActions.action,
          admin: admin.nickname,
          target: target.nickname,
          reason: adminActions.reason,
          payload: adminActions.payload,
          createdAt: adminActions.createdAt,
        })
        .from(adminActions)
        .innerJoin(admin, eq(admin.id, adminActions.adminId))
        .leftJoin(target, eq(target.id, adminActions.targetUserId))
        .orderBy(desc(adminActions.createdAt), desc(adminActions.id))
        .limit(limit)
        .offset(offset),
      this.db.select({ n: count() }).from(adminActions),
    ]);
    return {
      items: rows.map((r): AdminActionDto => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total: total?.n ?? 0,
    };
  }
}
