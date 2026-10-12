import { existsSync } from 'node:fs';
import { z } from 'zod';

if (existsSync('.env')) process.loadEnvFile('.env');

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().int().default(4200),
    COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    ADMIN_URL: z.string().default(''),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(20),
  })
  .parse(process.env);

export const config = {
  databaseUrl: env.DATABASE_URL,
  port: env.PORT,
  cookieSecure: env.COOKIE_SECURE === 'true',
  trustProxy: env.TRUST_PROXY,
  adminUrl: env.ADMIN_URL,
  throttleLimit: env.THROTTLE_LIMIT,
};
