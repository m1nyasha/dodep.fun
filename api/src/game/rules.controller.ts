import { CELLS, MINES, multiplier, SAFE, safeChance, type RulesDto } from '@dodep/shared';
import { Controller, Get } from '@nestjs/common';
import { RulesService } from './rules.service.js';

@Controller('rules')
export class RulesController {
  constructor(private readonly rules: RulesService) {}

  @Get()
  async get(): Promise<RulesDto> {
    const rule = await this.rules.active();
    return {
      version: rule.version,
      rtp: rule.rtp,
      minBet: rule.minBet,
      betStep: rule.betStep,
      startBalance: rule.startBalance,
      dailyTarget: rule.dailyTarget,
      cells: CELLS,
      mines: MINES,
      ladder: Array.from({ length: SAFE }, (_, i) => ({
        k: i + 1,
        chance: safeChance(i + 1),
        multiplier: multiplier(i + 1, rule.rtp),
      })),
    };
  }
}
