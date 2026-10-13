import { describe, expect, it } from 'vitest';
import type { AgentState } from '../decision.schema.js';
import { validDecision } from '../run-agent.js';

const state: AgentState = {
  agentId: 'a',
  nickname: 'AI_chaser',
  profileKey: 'loss-chaser',
  slot: 1,
  balance: 9900,
  completedRounds: 1,
  maxRounds: 50,
  wagered: 100,
  payout: 0,
  rule: { version: 1, rtp: 0.973, minBet: 100, betStep: 100 },
  activeRound: null,
  recentRounds: [],
  allowedActions: ['bet', 'stop'],
  terminalReason: null,
};

describe('validDecision', () => {
  it('only accepts available actions with legal bet amounts', () => {
    expect(validDecision({ action: 'bet', amount: 300, reason: 'Отыграться' }, state)).toBe(true);
    expect(validDecision({ action: 'bet', amount: 250, reason: 'Отыграться' }, state)).toBe(false);
    expect(validDecision({ action: 'bet', amount: 10000, reason: 'Отыграться' }, state)).toBe(false);
    expect(validDecision({ action: 'open', cell: 1, reason: 'Проверить' }, state)).toBe(false);
  });

  it('does not reopen an already safe cell', () => {
    const active: AgentState = {
      ...state,
      activeRound: { id: 'r', bet: 100, safeCount: 1, opened: [7], potentialPayout: 120 },
      allowedActions: ['open', 'cash_out'],
    };
    expect(validDecision({ action: 'open', cell: 7, reason: 'Тут безопасно' }, active)).toBe(false);
    expect(validDecision({ action: 'open', cell: 8, reason: 'Дальше' }, active)).toBe(true);
    expect(validDecision({ action: 'stop', reason: 'Хватит' }, active)).toBe(false);
  });
});
