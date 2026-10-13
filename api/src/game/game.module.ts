import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FeedModule } from '../feed/feed.module.js';
import { mineSourceProvider } from './mine-source.js';
import { RoundsController } from './rounds.controller.js';
import { RoundsService } from './rounds.service.js';
import { RulesController } from './rules.controller.js';
import { RulesService } from './rules.service.js';

@Global()
@Module({
  imports: [AuthModule, FeedModule],
  controllers: [RoundsController, RulesController],
  providers: [RoundsService, RulesService, mineSourceProvider],
  exports: [RulesService, RoundsService],
})
export class GameModule {}
