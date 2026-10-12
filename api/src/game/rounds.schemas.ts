import { CELLS } from '@dodep/shared';
import { z } from 'zod';

export const startSchema = z.object({ bet: z.number().int() });
export const openSchema = z.object({
  cell: z
    .number()
    .int()
    .min(0)
    .max(CELLS - 1),
});
export const roundIdSchema = z.uuid();
export const listSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
