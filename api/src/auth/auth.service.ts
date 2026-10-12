import { Inject, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { and, count, eq, gt } from 'drizzle-orm';
import { apiError } from '../common/api-error.js';
import { DB, type Db } from '../db/db.module.js';
import { isDuplicateKey } from '../db/errors.js';
import { authFingerprints, ledger, newId, settings, users } from '../db/schema.js';
import { RulesService } from '../game/rules.service.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { Fingerprint } from './fingerprint.js';
import { parseRegistrationLimit } from './registration-limit.js';
import { SESSION_TTL } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

const DUMMY_HASH = await hash('dodep-timing-equalizer');

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly sessions: SessionsService,
    private readonly rules: RulesService,
  ) {}

  async register(input: RegisterInput, fp: Fingerprint): Promise<string> {
    await this.assertRegistrationAllowed(fp);
    const taken = await this.db.select({ id: users.id }).from(users).where(eq(users.nickname, input.nickname));
    if (taken.length) throw apiError(409, 'NICKNAME_TAKEN', 'Этот ник уже занят');

    const passwordHash = await hash(input.password);
    const userId = newId();
    try {
      await this.db.transaction(async (tx) => {
        const rule = await this.rules.active(tx);
        const now = new Date();
        await tx.insert(users).values({
          id: userId,
          nickname: input.nickname,
          passwordHash,
          balance: rule.startBalance,
          lastDailyAt: now,
        });
        await tx.insert(ledger).values({
          userId,
          kind: 'signup',
          amount: rule.startBalance,
          balanceBefore: 0,
          balanceAfter: rule.startBalance,
        });
        await tx.insert(authFingerprints).values({ ...fp, userId, event: 'register' });
      });
    } catch (e) {
      if (isDuplicateKey(e)) throw apiError(409, 'NICKNAME_TAKEN', 'Этот ник уже занят');
      throw e;
    }
    return this.sessions.create(userId, 'user', SESSION_TTL);
  }

  async login(input: LoginInput, fp: Fingerprint): Promise<string> {
    const [user] = await this.db.select().from(users).where(eq(users.nickname, input.nickname));
    const ok = await verify(user?.passwordHash ?? DUMMY_HASH, input.password);
    if (!user || !ok) throw apiError(401, 'INVALID_CREDENTIALS', 'Неверный ник или пароль');
    if (user.blockedAt) throw apiError(403, 'ACCOUNT_BLOCKED', 'Аккаунт заблокирован');
    await this.db.insert(authFingerprints).values({ ...fp, userId: user.id, event: 'login' });
    return this.sessions.create(user.id, 'user', SESSION_TTL);
  }

  // ponytail: проверка вне транзакции — параллельные регистрации с одного IP могут превысить лимит на 1–2; для антиабуза достаточно.
  private async assertRegistrationAllowed(fp: Fingerprint): Promise<void> {
    const [row] = await this.db.select().from(settings).where(eq(settings.key, 'registration_limit'));
    const limit = parseRegistrationLimit(row?.value);
    const since = new Date(Date.now() - limit.windowHours * 3_600_000);
    const [recent] = await this.db
      .select({ n: count() })
      .from(authFingerprints)
      .where(
        and(
          eq(authFingerprints.ip, fp.ip),
          eq(authFingerprints.event, 'register'),
          gt(authFingerprints.createdAt, since),
        ),
      );
    if ((recent?.n ?? 0) < limit.count) return;
    await this.db.insert(authFingerprints).values({ ...fp, userId: null, event: 'register_denied' });
    throw apiError(403, 'REGISTRATION_UNAVAILABLE', 'Регистрация пока недоступна, повторите попытку позже');
  }
}
