import { Controller, Get, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { PlayersService } from './players.service.js';

const leaderboardQuery = z.object({
  filter: z.enum(['all', 'human', 'ai']).default('all'),
  q: z.string().trim().max(20).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

const statsQuery = z.object({ scope: z.enum(['human', 'ai']).default('human') });

@Controller()
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get('leaderboard')
  leaderboard(@Query({ schema: leaderboardQuery }) query: z.infer<typeof leaderboardQuery>) {
    return this.players.leaderboard(query);
  }

  @Get('players/:nickname')
  player(@Param('nickname') nickname: string) {
    return this.players.byNickname(nickname);
  }

  @Get('stats')
  stats(@Query({ schema: statsQuery }) query: z.infer<typeof statsQuery>) {
    return this.players.stats(query.scope);
  }
}
