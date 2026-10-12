import { z } from 'zod';

export const ticketSchema = z.object({ ticket: z.string().min(20).max(100) });
export const reasonSchema = z.object({ reason: z.string().trim().min(1, 'Укажите причину').max(255) });
export const optionalReasonSchema = z.object({ reason: z.string().trim().max(255).optional() });
export const pageSchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
