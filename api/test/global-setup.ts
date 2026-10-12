import { createConnection } from 'mysql2/promise';
import { runMigrations } from '../src/db/migrate.js';

export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const name = new URL(url).pathname.slice(1);
  const server = new URL(url);
  server.pathname = '/';
  const connection = await createConnection({ uri: server.toString() });
  await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
  await connection.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await connection.end();
  await runMigrations(url);
}
