import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { AdminTicketController } from './admin-ticket.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminAuthController, AdminTicketController],
  providers: [AdminSessionGuard],
})
export class AdminModule {}
