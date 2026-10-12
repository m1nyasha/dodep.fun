import { nextDailyAt, type MeDto } from '@dodep/shared';
import { Injectable } from '@nestjs/common';
import { config } from '../config.js';
import type { UserRow } from '../db/schema.js';
import { RulesService } from '../game/rules.service.js';
import { PlayersService } from './players.service.js';

@Injectable()
export class MeService {
  constructor(
    private readonly players: PlayersService,
    private readonly rules: RulesService,
  ) {}

  async get(user: UserRow): Promise<MeDto> {
    const [ranks, rule] = await Promise.all([this.players.ranks(user.nickname), this.rules.active()]);
    return {
      nickname: user.nickname,
      balance: user.balance,
      wagered: user.totalWagered,
      payout: user.totalPayout,
      net: user.totalPayout - user.totalWagered,
      roundsCount: user.roundsCount,
      rank: ranks?.rank ?? null,
      humanRank: ranks?.humanRank ?? null,
      status: user.statusText,
      statusHidden: Boolean(user.statusHiddenAt),
      nextDailyAt: nextDailyAt(user.lastDailyAt).toISOString(),
      dailyTarget: rule.dailyTarget,
      adminUrl: user.isAdmin && config.adminUrl ? config.adminUrl : null,
    };
  }
}
