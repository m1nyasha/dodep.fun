import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminController } from './admin.controller.js';
import { AdminSessionGuard } from './admin-session.guard.js';
import { AdminTicketController } from './admin-ticket.controller.js';
import { AuditService } from './audit.service.js';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { RulesAdminController } from './rules-admin.controller.js';
import { RulesAdminService } from './rules-admin.service.js';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminAuthController,
    AdminTicketController,
    AdminController,
    AccountsController,
    RulesAdminController,
    ExportController,
  ],
  providers: [AdminSessionGuard, AuditService, AccountsService, RulesAdminService, ExportService],
})
export class AdminModule {}
