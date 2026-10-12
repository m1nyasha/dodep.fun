import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lt, type SQL } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { roundActions, rounds, ruleVersions, users } from '../db/schema.js';
import type { ExportQuery } from './admin.schemas.js';

const DAY = 86_400_000;

// ponytail: выгрузка целиком в память с лимитом 100 000 строк — перейти на стрим mysql2, если понадобятся миллионы.
@Injectable()
export class ExportService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async rows(query: ExportQuery): Promise<Record<string, unknown>[]> {
    const where = and(...this.filters(query));
    if (query.kind === 'actions') {
      return this.db
        .select({
          roundId: roundActions.roundId,
          nickname: users.nickname,
          isAi: users.isAi,
          experimentId: rounds.experimentId,
          seq: roundActions.seq,
          type: roundActions.type,
          cell: roundActions.cell,
          result: roundActions.result,
          safeBefore: roundActions.safeBefore,
          multiplier: roundActions.multiplier,
          potentialPayout: roundActions.potentialPayout,
          createdAt: roundActions.createdAt,
        })
        .from(roundActions)
        .innerJoin(rounds, eq(rounds.id, roundActions.roundId))
        .innerJoin(users, eq(users.id, rounds.userId))
        .where(where)
        .orderBy(asc(rounds.startedAt), asc(roundActions.seq))
        .limit(query.limit);
    }
    return this.db
      .select({
        id: rounds.id,
        nickname: users.nickname,
        isAi: users.isAi,
        aiType: users.aiType,
        experimentId: rounds.experimentId,
        ruleVersion: ruleVersions.version,
        roundNo: rounds.roundNo,
        bet: rounds.bet,
        balanceBefore: rounds.balanceBefore,
        balanceAfter: rounds.balanceAfter,
        status: rounds.status,
        endReason: rounds.endReason,
        safeCount: rounds.safeCount,
        multiplier: rounds.multiplier,
        payout: rounds.payout,
        hitCell: rounds.hitCell,
        startedAt: rounds.startedAt,
        finishedAt: rounds.finishedAt,
      })
      .from(rounds)
      .innerJoin(users, eq(users.id, rounds.userId))
      .innerJoin(ruleVersions, eq(ruleVersions.id, rounds.ruleVersionId))
      .where(where)
      .orderBy(asc(rounds.startedAt))
      .limit(query.limit);
  }

  private filters(query: ExportQuery): SQL[] {
    const filters: SQL[] = [inArray(rounds.status, ['cashed_out', 'hit_mine'])];
    if (query.experimentId) filters.push(eq(rounds.experimentId, query.experimentId));
    if (query.isAi) filters.push(eq(users.isAi, query.isAi === 'true'));
    if (query.from) filters.push(gte(rounds.finishedAt, new Date(`${query.from}T00:00:00Z`)));
    if (query.to) filters.push(lt(rounds.finishedAt, new Date(Date.parse(`${query.to}T00:00:00Z`) + DAY)));
    return filters;
  }
}
