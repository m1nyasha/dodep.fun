import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DbModule } from './db/db.module.js';
import { FeedModule } from './feed/feed.module.js';
import { GameModule } from './game/game.module.js';
import { HealthModule } from './health/health.module.js';
import { PlayersModule } from './players/players.module.js';

@Module({ imports: [DbModule, HealthModule, AuthModule, PlayersModule, GameModule, FeedModule] })
export class AppModule {}
