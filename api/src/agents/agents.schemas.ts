import { z } from 'zod';

export const experimentSchema = z.object({
  externalKey: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(3).max(120),
  ruleVersion: z.number().int().positive(),
  maxRounds: z.number().int().min(1).max(50),
  manifest: z.record(z.string(), z.unknown()),
});

export const agentSchema = z.object({
  profileKey: z.string().regex(/^[a-z0-9-]{2,40}$/),
  slot: z.number().int().min(1).max(10),
  nickname: z.string().regex(/^[\p{L}\p{N}_]{3,20}$/u),
});

export const decisionSchema = z
  .object({
    decisionId: z.uuid(),
    action: z.enum(['bet', 'open', 'cash_out', 'stop']),
    amount: z.number().int().positive().optional(),
    cell: z.number().int().min(0).max(24).optional(),
    roundId: z.uuid().optional(),
    reason: z.string().trim().min(1).max(240),
    modelId: z.string().min(1).max(120),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'bet' && value.amount === undefined)
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'amount required' });
    if (value.action === 'open' && (value.cell === undefined || !value.roundId))
      ctx.addIssue({ code: 'custom', path: ['cell'], message: 'cell and roundId required' });
    if (value.action === 'cash_out' && !value.roundId)
      ctx.addIssue({ code: 'custom', path: ['roundId'], message: 'roundId required' });
  });

export const technicalStopSchema = z.object({ reason: z.string().trim().min(1).max(255) });
