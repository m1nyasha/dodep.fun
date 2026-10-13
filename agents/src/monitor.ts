import { existsSync } from 'node:fs';
import { startDashboard } from './dashboard.js';
import { GameClient } from './game-client.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const args = process.argv.slice(2);
const experimentId = args[args.indexOf('--id') + 1];
const portText = args.includes('--port') ? args[args.indexOf('--port') + 1] : '4400';
const port = Number(portText);
if (!experimentId || !/^[0-9a-f-]{36}$/i.test(experimentId) || !Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Usage: pnpm monitor --id <experimentId> [--port 4400]');
  process.exit(2);
}
if (!process.env.INTERNAL_AGENT_API_TOKEN) throw new Error('Set INTERNAL_AGENT_API_TOKEN in agents/.env');
const game = new GameClient(
  process.env.AGENT_API_URL ?? 'http://localhost:4200/api',
  process.env.INTERNAL_AGENT_API_TOKEN,
);
await game.monitor(experimentId);
await startDashboard(game, experimentId, port);
console.log(`Dashboard: http://127.0.0.1:${port}`);
