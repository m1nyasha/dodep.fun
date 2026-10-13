import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AdminModule } from './admin/admin.module.js';
import { AgentsModule } from './agents/agents.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DbModule } from './db/db.module.js';
import { FeedModule } from './feed/feed.module.js';
import { GameModule } from './game/game.module.js';
import { HealthModule } from './health/health.module.js';
import { PlayersModule } from './players/players.module.js';

@Module({
  imports: [
    SentryModule.forRoot(),
    DbModule,
    HealthModule,
    AuthModule,
    PlayersModule,
    GameModule,
    FeedModule,
    AdminModule,
    AgentsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
