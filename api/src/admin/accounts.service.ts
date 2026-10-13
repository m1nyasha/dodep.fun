import type {
  AdminAccountDetailDto,
  AdminAccountDto,
  AdminAccountsPageDto,
  AdminStatusDto,
  FingerprintDto,
  RelatedAccountDto,
} from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNotNull, like, ne } from 'drizzle-orm';
import { apiError } from '../common/api-error.js';
import { DB, type Db, type Tx } from '../db/db.module.js';
import { authFingerprints, ledger, rounds, sessions, users, type UserRow } from '../db/schema.js';
import { rankedPlayers } from '../players/ranking.js';
import { AuditService } from './audit.service.js';

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function toAccountDto(u: UserRow): AdminAccountDto {
  return {
    nickname: u.nickname,
    isAi: u.isAi,
    aiType: u.aiType,
    isAdmin: u.isAdmin,
    balance: u.balance,
    net: u.totalPayout - u.totalWagered,
    roundsCount: u.roundsCount,
    blockedAt: iso(u.blockedAt),
    blockReason: u.blockReason,
    createdAt: u.createdAt.toISOString(),
  };
}

const RELATED_LIMIT = 50;

@Injectable()
export class AccountsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  async list(q: string | undefined, offset: number, limit: number): Promise<AdminAccountsPageDto> {
    const where = q ? like(users.nickname, `%${q.replace(/[\\%_]/g, '\\$&')}%`) : undefined;
    const [rows, [total]] = await Promise.all([
      this.db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      this.db.select({ n: count() }).from(users).where(where),
    ]);
    return { items: rows.map(toAccountDto), total: total?.n ?? 0 };
  }

  async detail(nickname: string): Promise<AdminAccountDetailDto> {
    const user = await this.byNickname(this.db, nickname);
    const fingerprints = await this.db
      .select()
      .from(authFingerprints)
      .where(eq(authFingerprints.userId, user.id))
      .orderBy(desc(authFingerprints.createdAt))
      .limit(30);
    const keys = await this.db
      .selectDistinct({ ip: authFingerprints.ip, clientHash: authFingerprints.clientHash })
      .from(authFingerprints)
      .where(eq(authFingerprints.userId, user.id));
    const ips = [...new Set(keys.map((k) => k.ip))];
    const hashes = [...new Set(keys.map((k) => k.clientHash).filter((h): h is string => Boolean(h)))];

    const related = async (via: 'ip' | 'client', values: string[]): Promise<RelatedAccountDto[]> => {
      if (!values.length) return [];
      const column = via === 'ip' ? authFingerprints.ip : authFingerprints.clientHash;
      const rows = await this.db
        .selectDistinct({ nickname: users.nickname, blockedAt: users.blockedAt, value: column })
        .from(authFingerprints)
        .innerJoin(users, eq(users.id, authFingerprints.userId))
        .where(and(inArray(column, values), ne(users.id, user.id)))
        .limit(RELATED_LIMIT);
      return rows.map((r) => ({ nickname: r.nickname, via, value: r.value ?? '', blocked: Boolean(r.blockedAt) }));
    };

    return {
      account: toAccountDto(user),
      status: { text: user.statusText, hiddenAt: iso(user.statusHiddenAt), updatedAt: iso(user.statusUpdatedAt) },
      fingerprints: fingerprints.map((f): FingerprintDto => ({
        event: f.event,
        ip: f.ip,
        userAgent: f.userAgent,
        acceptLanguage: f.acceptLanguage,
        clientHash: f.clientHash,
        createdAt: f.createdAt.toISOString(),
      })),
      related: [...(await related('ip', ips)), ...(await related('client', hashes))],
    };
  }

  async setBlocked(admin: UserRow, nickname: string, blocked: boolean, reason: string): Promise<AdminAccountDto> {
    return this.db.transaction(async (tx) => {
      const user = await this.byNickname(tx, nickname, true);
      if (user.id === admin.id) throw apiError(400, 'SELF_ACTION', 'Нельзя заблокировать себя');
      const patch = blocked ? { blockedAt: new Date(), blockReason: reason } : { blockedAt: null, blockReason: null };
      await tx.update(users).set(patch).where(eq(users.id, user.id));
      if (blocked) await tx.delete(sessions).where(eq(sessions.userId, user.id));
      await this.audit.log(tx, {
        adminId: admin.id,
        action: blocked ? 'block' : 'unblock',
        targetUserId: user.id,
        reason,
      });
      return toAccountDto({ ...user, ...patch });
    });
  }

  async adjustCoins(admin: UserRow, nickname: string, amount: number, reason: string): Promise<AdminAccountDto> {
    return this.db.transaction(async (tx) => {
      const user = await this.byNickname(tx, nickname, true);
      const [active] = await tx
        .select({ id: rounds.id })
        .from(rounds)
        .where(and(eq(rounds.userId, user.id), eq(rounds.status, 'active')));
      if (active) throw apiError(409, 'ROUND_ACTIVE', 'Раунд уже идёт');
      const balanceAfter = user.balance + amount;
      if (balanceAfter < 0) throw apiError(400, 'INSUFFICIENT_BALANCE', 'Недостаточно монет');
      await tx.update(users).set({ balance: balanceAfter }).where(eq(users.id, user.id));
      await tx.insert(ledger).values({
        userId: user.id,
        kind: 'admin',
        amount,
        balanceBefore: user.balance,
        balanceAfter,
      });
      await this.audit.log(tx, {
        adminId: admin.id,
        action: 'coins_adjust',
        targetUserId: user.id,
        payload: { amount, balanceBefore: user.balance, balanceAfter },
        reason,
      });
      return toAccountDto({ ...user, balance: balanceAfter });
    });
  }

  async statuses(): Promise<AdminStatusDto[]> {
    const ranked = rankedPlayers(this.db);
    const rows = await this.db
      .select({
        nickname: users.nickname,
        text: users.statusText,
        hiddenAt: users.statusHiddenAt,
        updatedAt: users.statusUpdatedAt,
        humanRank: ranked.humanRank,
      })
      .from(users)
      .leftJoin(ranked, eq(ranked.nickname, users.nickname))
      .where(isNotNull(users.statusText))
      .orderBy(desc(users.statusUpdatedAt));
    return rows.map((r) => ({
      nickname: r.nickname,
      text: r.text ?? '',
      hiddenAt: iso(r.hiddenAt),
      updatedAt: iso(r.updatedAt),
      humanRank: r.humanRank === null ? null : Number(r.humanRank),
    }));
  }

  async setStatusHidden(admin: UserRow, nickname: string, hidden: boolean, reason: string): Promise<AdminStatusDto> {
    await this.db.transaction(async (tx) => {
      const user = await this.byNickname(tx, nickname, true);
      await tx
        .update(users)
        .set({ statusHiddenAt: hidden ? new Date() : null })
        .where(eq(users.id, user.id));
      await this.audit.log(tx, {
        adminId: admin.id,
        action: hidden ? 'hide_status' : 'show_status',
        targetUserId: user.id,
        payload: { text: user.statusText },
        reason,
      });
    });
    const found = (await this.statuses()).find((s) => s.nickname.toLowerCase() === nickname.toLowerCase());
    if (!found) throw apiError(404, 'ACCOUNT_NOT_FOUND', 'У аккаунта нет статуса');
    return found;
  }

  private async byNickname(tx: Db | Tx, nickname: string, lock = false): Promise<UserRow> {
    const query = tx.select().from(users).where(eq(users.nickname, nickname));
    const [user] = lock ? await query.for('update') : await query;
    if (!user) throw apiError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
    return user;
  }
}
