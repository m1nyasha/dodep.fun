import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { config } from '../config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionGuard } from './session.guard.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: config.throttleLimit }])],
  controllers: [AuthController],
  providers: [AuthService, SessionsService, SessionGuard],
  exports: [SessionsService, SessionGuard],
})
export class AuthModule {}
