import 'reflect-metadata';
import type { Server } from 'node:http';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import type { Pool } from 'mysql2/promise';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AgentTokenGuard } from '../src/agents/agent-token.guard.js';
import { setupApp } from '../src/app.setup.js';
import { DB, POOL, type Db } from '../src/db/db.module.js';
import { settings, users } from '../src/db/schema.js';

let mines = [0, 1, 2, 3, 4];
export const setMines = (next: number[]) => {
  mines = next;
};

const DATA_TABLES = [
  'admin_actions',
  'agent_decisions',
  'experiment_agents',
  'status_history',
  'auth_fingerprints',
  'ledger',
  'round_actions',
  'rounds',
  'experiments',
  'sessions',
  'users',
];

export interface TestApp {
  app: NestExpressApplication;
  server: Server;
  db: Db;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export async function createTestApp(options: { agentApi?: boolean } = {}): Promise<TestApp> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.agentApi) builder.overrideGuard(AgentTokenGuard).useValue({ canActivate: () => true });
  // `game/mine-source.ts` lands in Task 6; `as string` keeps TS from resolving the module eagerly.
  const mineSourcePath = '../src/game/mine-source.js' as string;
  const { MINE_SOURCE } = await import(mineSourcePath).catch(() => ({ MINE_SOURCE: null }));
  if (MINE_SOURCE) builder.overrideProvider(MINE_SOURCE).useValue(() => [...mines]);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  setupApp(app);
  await app.init();
  const db = app.get<Db>(DB);
  const pool = app.get<Pool>(POOL);

  return {
    app,
    server: app.getHttpServer() as Server,
    db,
    async reset() {
      mines = [0, 1, 2, 3, 4];
      const connection = await pool.getConnection();
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of DATA_TABLES) await connection.query(`TRUNCATE TABLE \`${table}\``);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      } finally {
        connection.release();
      }
      await db
        .update(settings)
        .set({ value: { count: 1000, windowHours: 24 } })
        .where(eq(settings.key, 'registration_limit'));
    },
    close: () => app.close(),
  };
}

export const PASSWORD = 'password123';

export async function register(server: Server, nickname: string, opts: { ip?: string } = {}) {
  const agent = request.agent(server);
  await agent
    .post('/api/auth/register')
    .set('X-Forwarded-For', opts.ip ?? '10.0.0.1')
    .send({ nickname, password: PASSWORD, agree: true })
    .expect(204);
  return agent;
}

export async function setUser(db: Db, nickname: string, patch: Partial<typeof users.$inferInsert>) {
  await db.update(users).set(patch).where(eq(users.nickname, nickname));
}
