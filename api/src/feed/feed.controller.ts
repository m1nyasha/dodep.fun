import type { FeedEventDto } from '@dodep/shared';
import { Controller, Get, Inject } from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { rounds, users } from '../db/schema.js';

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

@Controller('feed')
export class FeedController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get()
  async recent(): Promise<FeedEventDto[]> {
    const rows = await this.db
      .select({
        nickname: users.nickname,
        isAi: users.isAi,
        safeCount: rounds.safeCount,
        status: rounds.status,
        bet: rounds.bet,
        payout: rounds.payout,
        finishedAt: rounds.finishedAt,
      })
      .from(rounds)
      .innerJoin(users, eq(users.id, rounds.userId))
      .where(and(inArray(rounds.status, ['cashed_out', 'hit_mine']), isNull(users.blockedAt)))
      .orderBy(desc(rounds.finishedAt))
      .limit(6);
    return rows.map((r) => ({
      type: 'round.finished',
      nickname: r.nickname,
      isAi: r.isAi,
      safeCount: r.safeCount,
      win: r.status === 'cashed_out',
      net: r.payout - r.bet,
      at: required(r.finishedAt, `finished round for ${r.nickname} missing finishedAt`).toISOString(),
    }));
  }
}
