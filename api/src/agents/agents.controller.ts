import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AgentTokenGuard } from './agent-token.guard.js';
import { AgentsService } from './agents.service.js';
import { agentSchema, decisionSchema, experimentSchema, technicalStopSchema } from './agents.schemas.js';

const idSchema = z.uuid();

@Controller('internal/experiments')
@UseGuards(AgentTokenGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post()
  create(@Body({ schema: experimentSchema }) body: z.infer<typeof experimentSchema>) {
    return this.agents.createExperiment(body);
  }

  @Post(':id/agents')
  createAgent(
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: agentSchema }) body: z.infer<typeof agentSchema>,
  ) {
    return this.agents.createAgent(id, body);
  }

  @Get(':id/agents/:agentId/state')
  state(@Param('id', { schema: idSchema }) id: string, @Param('agentId', { schema: idSchema }) agentId: string) {
    return this.agents.state(id, agentId);
  }

  @Post(':id/agents/:agentId/decisions')
  @HttpCode(200)
  decide(
    @Param('id', { schema: idSchema }) id: string,
    @Param('agentId', { schema: idSchema }) agentId: string,
    @Body({ schema: decisionSchema }) body: z.infer<typeof decisionSchema>,
  ) {
    return this.agents.decide(id, agentId, body);
  }

  @Post(':id/agents/:agentId/technical-stop')
  @HttpCode(200)
  technicalStop(
    @Param('id', { schema: idSchema }) id: string,
    @Param('agentId', { schema: idSchema }) agentId: string,
    @Body({ schema: technicalStopSchema }) body: z.infer<typeof technicalStopSchema>,
  ) {
    return this.agents.technicalStop(id, agentId, body.reason);
  }

  @Post(':id/agents/:agentId/resume')
  @HttpCode(200)
  resume(@Param('id', { schema: idSchema }) id: string, @Param('agentId', { schema: idSchema }) agentId: string) {
    return this.agents.resume(id, agentId);
  }

  @Post(':id/finish')
  @HttpCode(200)
  finish(@Param('id', { schema: idSchema }) id: string) {
    return this.agents.finish(id);
  }

  @Get(':id/monitor')
  monitor(@Param('id', { schema: idSchema }) id: string) {
    return this.agents.monitor(id);
  }

  @Get(':id/decisions')
  decisions(@Param('id', { schema: idSchema }) id: string) {
    return this.agents.exportDecisions(id);
  }
}
