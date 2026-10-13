import { randomUUID } from 'node:crypto';
import type { Profile } from './profiles/index.js';
import type { AgentState, Decision, RunConfig } from './decision.schema.js';
import type { GameClient } from './game-client.js';
import type { ModelClient } from './model-client.js';

export interface Budget {
  totalTokens: number;
  callsByAgent: Map<string, number>;
  deadline: number;
}

export function technicalLimitReason(
  budget: Budget,
  config: RunConfig,
  agentId: string,
  now = Date.now(),
): string | null {
  const calls = budget.callsByAgent.get(agentId) ?? 0;
  if (calls >= config.maxModelCallsPerAgent)
    return `Достигнут лимит вызовов модели: ${calls} / ${config.maxModelCallsPerAgent}`;
  if (budget.totalTokens >= config.maxTotalTokens)
    return `Достигнут лимит токенов: ${budget.totalTokens} / ${config.maxTotalTokens}`;
  if (now >= budget.deadline) return `Достигнут лимит времени: ${config.maxDurationMinutes} мин`;
  return null;
}

function safeReason(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
  return [process.env.DEEPSEEK_API_KEY, process.env.INTERNAL_AGENT_API_TOKEN]
    .filter((secret): secret is string => Boolean(secret))
    .reduce((text, secret) => text.replaceAll(secret, '[redacted]'), message)
    .slice(0, 255);
}

export function validDecision(decision: Decision, state: AgentState): boolean {
  if (!state.allowedActions.includes(decision.action)) return false;
  if (decision.action === 'bet')
    return (
      decision.amount >= state.rule.minBet &&
      decision.amount <= state.balance &&
      decision.amount % state.rule.betStep === 0
    );
  if (decision.action === 'open')
    return Boolean(state.activeRound && !state.activeRound.opened.includes(decision.cell));
  return true;
}

export async function runAgent(args: {
  experimentId: string;
  agentId: string;
  profile: Profile;
  instructions: string;
  config: RunConfig;
  game: GameClient;
  model: ModelClient;
  budget: Budget;
  log: (entry: Record<string, unknown>) => Promise<void>;
}) {
  const { experimentId, agentId, profile, instructions, config, game, model, budget, log } = args;
  try {
    while (true) {
      const state = await game.state(experimentId, agentId);
      if (state.terminalReason) return;
      const limit = technicalLimitReason(budget, config, agentId);
      if (limit) throw new Error(limit);

      let response: Awaited<ReturnType<ModelClient['decide']>> | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        const limit = technicalLimitReason(budget, config, agentId);
        if (limit) throw new Error(limit);
        budget.callsByAgent.set(agentId, (budget.callsByAgent.get(agentId) ?? 0) + 1);
        try {
          response = await model.decide(instructions, state);
        } catch (error) {
          await log({
            type: 'model_error',
            agentId,
            profileKey: profile.key,
            reason: safeReason(error),
          });
          if (attempt === 2) throw error;
          continue;
        }
        if (!response) throw new Error('Модель не вернула решение');
        budget.totalTokens += response.inputTokens + response.outputTokens;
        await log({
          type: 'model_decision',
          agentId,
          profileKey: profile.key,
          state,
          decision: response.decision,
          usage: { inputTokens: response.inputTokens, outputTokens: response.outputTokens },
          modelId: response.modelId,
        });
        if (validDecision(response.decision, state)) break;
        response = undefined;
      }
      if (!response) throw new Error('Модель трижды выбрала недопустимое действие');

      const decision = response.decision;
      const body = {
        ...decision,
        decisionId: randomUUID(),
        roundId: decision.action === 'open' || decision.action === 'cash_out' ? state.activeRound?.id : undefined,
        modelId: response.modelId,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      };
      const result = await game.decide(experimentId, agentId, body);
      await log({ type: 'applied', agentId, decisionId: body.decisionId, result });
    }
  } catch (error) {
    const reason = safeReason(error);
    await log({ type: 'technical_stop', agentId, reason });
    await game.technicalStop(experimentId, agentId, reason);
    throw error;
  }
}
