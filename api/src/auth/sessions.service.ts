import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { sessions, users, type UserRow } from '../db/schema.js';

export type SessionKind = 'user' | 'admin' | 'admin_ticket';

@Injectable()
export class SessionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, kind: SessionKind, ttlMs: number): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.db.insert(sessions).values({
      userId,
      kind,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + ttlMs),
    });
    return token;
  }

  async findUser(token: string, kind: SessionKind): Promise<UserRow | null> {
    const [row] = await this.db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(eq(sessions.tokenHash, this.hashToken(token)), eq(sessions.kind, kind), gt(sessions.expiresAt, new Date())),
      );
    return row?.user ?? null;
  }

  async revoke(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, this.hashToken(token)));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
