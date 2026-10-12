import { pathToFileURL } from 'node:url';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import type { Db } from '../db/db.module.js';
import * as schema from '../db/schema.js';

export async function setAdmin(db: Db, nickname: string, value: boolean): Promise<boolean> {
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.nickname, nickname));
  if (!user) return false;
  await db.update(schema.users).set({ isAdmin: value }).where(eq(schema.users.id, user.id));
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const nickname = args.find((a) => !a.startsWith('--'));
  const revoke = args.includes('--revoke');
  if (!nickname) {
    console.error('Usage: admin:grant <nickname> [--revoke]');
    process.exit(1);
  }
  const { config } = await import('../config.js');
  const pool = createPool({ uri: config.databaseUrl, timezone: 'Z' });
  const ok = await setAdmin(drizzle({ client: pool, schema, mode: 'default' }), nickname, !revoke);
  await pool.end();
  console.log(ok ? `${nickname}: ${revoke ? 'админ снят' : 'теперь админ'}` : `Аккаунт ${nickname} не найден`);
  process.exit(ok ? 0 : 1);
}
