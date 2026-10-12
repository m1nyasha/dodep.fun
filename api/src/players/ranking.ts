import type { PlayerDto } from '@dodep/shared';
import { isNull, sql } from 'drizzle-orm';
import type { Db, Tx } from '../db/db.module.js';
import { users } from '../db/schema.js';

export const TOP_HUMANS = 5;

export function rankedPlayers(db: Db | Tx) {
  return db
    .select({
      nickname: users.nickname,
      isAi: users.isAi,
      aiType: users.aiType,
      balance: users.balance,
      totalWagered: users.totalWagered,
      totalPayout: users.totalPayout,
      roundsCount: users.roundsCount,
      statusText: users.statusText,
      statusHiddenAt: users.statusHiddenAt,
      createdAt: users.createdAt,
      rank: sql<number>`cast(row_number() over (order by ${users.balance} desc, ${users.createdAt}) as unsigned)`.as(
        'rank',
      ),
      humanRank: sql<
        number | null
      >`if(${users.isAi}, null, cast(row_number() over (partition by ${users.isAi} order by ${users.balance} desc, ${users.createdAt}) as unsigned))`.as(
        'human_rank',
      ),
    })
    .from(users)
    .where(isNull(users.blockedAt))
    .as('ranked');
}

type RankedRow = {
  nickname: string;
  isAi: boolean;
  aiType: string | null;
  balance: number;
  totalWagered: number;
  totalPayout: number;
  roundsCount: number;
  statusText: string | null;
  statusHiddenAt: Date | null;
  createdAt: Date | string;
  rank: number;
  humanRank: number | null;
};

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  // The subquery column skips drizzle's column mapper, so MySQL's "YYYY-MM-DD HH:mm:ss.SSS" string
  // arrives untouched. It has no timezone marker; the pool runs with timezone: 'Z' (UTC), so append it.
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

export function toPlayerDto(row: RankedRow): PlayerDto {
  const humanRank = row.humanRank === null ? null : Number(row.humanRank);
  const isTop = humanRank !== null && humanRank <= TOP_HUMANS;
  return {
    nickname: row.nickname,
    isAi: Boolean(row.isAi),
    aiType: row.aiType,
    rank: Number(row.rank),
    humanRank,
    isTop,
    balance: row.balance,
    net: row.totalPayout - row.totalWagered,
    roundsCount: row.roundsCount,
    status: isTop && !row.statusHiddenAt ? row.statusText : null,
    createdAt: toDate(row.createdAt).toISOString(),
  };
}
