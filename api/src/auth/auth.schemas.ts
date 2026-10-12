import { z } from 'zod';

const nickname = z
  .string()
  .trim()
  .regex(/^[\p{L}\p{N}_]{3,20}$/u, '3–20 символов: буквы, цифры или _');
const password = z.string().min(8, 'Нужно минимум 8 символов').max(128);
const clientHash = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .optional();

export const registerSchema = z.object({ nickname, password, agree: z.literal(true), clientHash });
export const loginSchema = z.object({
  nickname: z.string().trim().min(1).max(20),
  password: z.string().min(1).max(128),
  clientHash,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
