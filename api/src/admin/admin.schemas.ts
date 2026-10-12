import { ruleInputErrors } from '@dodep/shared';
import { z } from 'zod';

export const ticketSchema = z.object({ ticket: z.string().min(20).max(100) });
export const reasonSchema = z.object({ reason: z.string().trim().min(1, 'Укажите причину').max(255) });
export const optionalReasonSchema = z.object({ reason: z.string().trim().max(255).optional() });
export const pageSchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const ruleSchema = z
  .object({
    rtp: z.number(),
    minBet: z.number(),
    betStep: z.number(),
    startBalance: z.number(),
    dailyTarget: z.number(),
    reason: z.string().trim().max(255).optional(),
  })
  .superRefine((value, ctx) => {
    for (const [path, message] of Object.entries(ruleInputErrors(value)))
      ctx.addIssue({ code: 'custom', path: [path], message });
  });
