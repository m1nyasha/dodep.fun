import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller.js';
import { AgentsService } from './agents.service.js';
import { AgentTokenGuard } from './agent-token.guard.js';

@Module({ controllers: [AgentsController], providers: [AgentsService, AgentTokenGuard] })
export class AgentsModule {}
