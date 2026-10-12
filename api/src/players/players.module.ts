import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MeController } from './me.controller.js';
import { MeService } from './me.service.js';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PlayersController, MeController],
  providers: [PlayersService, MeService],
  exports: [PlayersService, MeService],
})
export class PlayersModule {}
