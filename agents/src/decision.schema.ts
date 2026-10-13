import { z } from 'zod';

export const decisionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('bet'), amount: z.number().int(), reason: z.string().min(1).max(240) }),
  z.object({ action: z.literal('open'), cell: z.number().int().min(0).max(24), reason: z.string().min(1).max(240) }),
  z.object({ action: z.literal('cash_out'), reason: z.string().min(1).max(240) }),
  z.object({ action: z.literal('stop'), reason: z.string().min(1).max(240) }),
]);

export type Decision = z.infer<typeof decisionSchema>;

export const runConfigSchema = z.object({
  name: z.string().min(3).max(120),
  ruleVersion: z.number().int().positive(),
  maxRounds: z.number().int().min(1).max(2_147_483_647),
  modelId: z.string().min(1),
  maxConcurrentModelCalls: z.number().int().min(1).max(100),
  maxModelCallsPerAgent: z.number().int().min(1),
  maxTotalTokens: z.number().int().min(1),
  maxDurationMinutes: z.number().int().min(1),
  dashboardPort: z.number().int().min(1024).max(65535),
});

export type RunConfig = z.infer<typeof runConfigSchema>;

export interface AgentState {
  agentId: string;
  nickname: string;
  profileKey: string;
  stopReason?: string | null;
  slot: number;
  balance: number;
  completedRounds: number;
  maxRounds: number;
  wagered: number;
  payout: number;
  rule: { version: number; rtp: number; minBet: number; betStep: number };
  activeRound: null | { id: string; bet: number; safeCount: number; opened: number[]; potentialPayout: number };
  recentRounds: { bet: number; payout: number; safeCount: number; status: string; finishedAt: string | null }[];
  allowedActions: string[];
  terminalReason: string | null;
}
