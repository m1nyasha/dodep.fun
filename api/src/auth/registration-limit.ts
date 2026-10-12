import { z } from 'zod';

const schema = z.object({ count: z.number().int().positive(), windowHours: z.number().positive() });
const fallback = { count: 5, windowHours: 24 };

export function parseRegistrationLimit(value: unknown): { count: number; windowHours: number } {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
