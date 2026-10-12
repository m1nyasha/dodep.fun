import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DbModule } from './db/db.module.js';
import { HealthModule } from './health/health.module.js';
import { PlayersModule } from './players/players.module.js';

@Module({ imports: [DbModule, HealthModule, AuthModule, PlayersModule] })
export class AppModule {}
