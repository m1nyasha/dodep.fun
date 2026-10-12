import type { LeaderboardDto, PlayerDto, StatsDto, StatsScope } from '@dodep/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull, like, type SQL } from 'drizzle-orm';
import { apiError } from '../common/api-error.js';
import { DB, type Db } from '../db/db.module.js';
import { users } from '../db/schema.js';
import { rankedPlayers, toPlayerDto } from './ranking.js';
import { summarize } from './stats.js';

export interface LeaderboardQuery {
  filter: 'all' | 'human' | 'ai';
  q?: string;
  offset: number;
  limit: number;
}

@Injectable()
export class PlayersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async leaderboard(query: LeaderboardQuery): Promise<LeaderboardDto> {
    const ranked = rankedPlayers(this.db);
    const filters: SQL[] = [];
    if (query.filter !== 'all') filters.push(eq(ranked.isAi, query.filter === 'ai'));
    if (query.q) filters.push(like(ranked.nickname, `%${query.q.replace(/[\\%_]/g, '\\$&')}%`));
    const where = filters.length ? and(...filters) : undefined;

    const [items, [total]] = await Promise.all([
      this.db.select().from(ranked).where(where).orderBy(ranked.rank).limit(query.limit).offset(query.offset),
      this.db.select({ n: count() }).from(ranked).where(where),
    ]);
    return { items: items.map(toPlayerDto), total: total?.n ?? 0 };
  }

  async byNickname(nickname: string): Promise<PlayerDto> {
    const ranked = rankedPlayers(this.db);
    const [row] = await this.db.select().from(ranked).where(eq(ranked.nickname, nickname));
    if (!row) throw apiError(404, 'PLAYER_NOT_FOUND', 'Игрок не найден или скрыт из рейтинга');
    return toPlayerDto(row);
  }

  async ranks(nickname: string): Promise<{ rank: number; humanRank: number | null } | null> {
    const ranked = rankedPlayers(this.db);
    const [row] = await this.db
      .select({ rank: ranked.rank, humanRank: ranked.humanRank })
      .from(ranked)
      .where(eq(ranked.nickname, nickname));
    return row ? { rank: Number(row.rank), humanRank: row.humanRank === null ? null : Number(row.humanRank) } : null;
  }

  // ponytail: агрегаты считаются в памяти по всем аккаунтам — перейти на SQL-агрегаты, когда аккаунтов станет десятки тысяч.
  async stats(scope: StatsScope): Promise<StatsDto> {
    const rows = await this.db
      .select({
        balance: users.balance,
        totalWagered: users.totalWagered,
        totalPayout: users.totalPayout,
        roundsCount: users.roundsCount,
      })
      .from(users)
      .where(and(isNull(users.blockedAt), eq(users.isAi, scope === 'ai')));
    return summarize(rows, scope);
  }
}
