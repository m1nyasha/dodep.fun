import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import { createPool, type Pool } from 'mysql2/promise';
import { config } from '../config.js';
import * as schema from './schema.js';

export const DB = Symbol('DB');
export const POOL = Symbol('POOL');
export type Db = MySql2Database<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

@Global()
@Module({
  providers: [
    { provide: POOL, useFactory: () => createPool({ uri: config.databaseUrl, timezone: 'Z', connectionLimit: 10 }) },
    { provide: DB, inject: [POOL], useFactory: (pool: Pool) => drizzle({ client: pool, schema, mode: 'default' }) },
  ],
  exports: [DB, POOL],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
