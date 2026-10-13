import { createHash } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { runConfigSchema } from './decision.schema.js';
import { GameClient } from './game-client.js';
import { ModelClient } from './model-client.js';
import { profiles } from './profiles/index.js';
import { runAgent, type Budget } from './run-agent.js';
import { startDashboard } from './dashboard.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const args = process.argv.slice(2);
const resumeTechnical = args.includes('--resume-technical');
const key = args[args.indexOf('--key') + 1];
const configPath = args.includes('--config') ? args[args.indexOf('--config') + 1] : 'runs/experiment.example.json';
if (!key || !/^[a-zA-Z0-9_-]{3,120}$/.test(key) || !configPath) {
  console.error('Usage: pnpm start --key pilot-001 [--config runs/experiment.example.json]');
  process.exit(2);
}
if (!process.env.INTERNAL_AGENT_API_TOKEN || !process.env.DEEPSEEK_API_KEY)
  throw new Error('Set INTERNAL_AGENT_API_TOKEN and DEEPSEEK_API_KEY in agents/.env');

const config = runConfigSchema.parse(JSON.parse(await readFile(resolve(configPath), 'utf8')));
const game = new GameClient(
  process.env.AGENT_API_URL ?? 'http://localhost:4200/api',
  process.env.INTERNAL_AGENT_API_TOKEN,
);
const model = new ModelClient(config.modelId, config.maxConcurrentModelCalls);
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const promptFiles = await Promise.all(
  profiles.map(async (profile) => {
    const path = fileURLToPath(new URL(`../src/profiles/${profile.instructionsFile}`, import.meta.url));
    const instructions = await readFile(path, 'utf8');
    return { profile, instructions, hash: sha(instructions) };
  }),
);
const codeRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const lockfileHash = sha(await readFile(resolve('../pnpm-lock.yaml')));
const manifest = {
  config,
  codeRevision,
  lockfileHash,
  provider: 'deepseek',
  thinking: 'disabled',
  participantsPerProfile: 1,
  profiles: promptFiles.map(({ profile, hash }) => ({ key: profile.key, title: profile.title, promptHash: hash })),
};
const experiment = await game.createExperiment({
  externalKey: key,
  name: config.name,
  ruleVersion: config.ruleVersion,
  maxRounds: config.maxRounds,
  manifest,
});
const experimentId = experiment.id;
const logPath = resolve(`runs/${key}.jsonl`);
const log = async (entry: Record<string, unknown>) => {
  await appendFile(logPath, `${JSON.stringify({ at: new Date().toISOString(), experimentId, ...entry })}\n`);
};

const history = await game.decisions(experimentId);
const localHistory = existsSync(logPath)
  ? (await readFile(logPath, 'utf8')).split('\n').flatMap((line) => {
      if (!line.trim()) return [];
      try {
        return [
          JSON.parse(line) as {
            type?: string;
            agentId?: string;
            usage?: { inputTokens: number; outputTokens: number };
          },
        ];
      } catch {
        return [];
      }
    })
  : [];
const localCalls = new Map<string, number>();
let localTokens = 0;
for (const entry of localHistory) {
  if (!entry.agentId || (entry.type !== 'model_decision' && entry.type !== 'model_error')) continue;
  localCalls.set(entry.agentId, (localCalls.get(entry.agentId) ?? 0) + 1);
  localTokens += (entry.usage?.inputTokens ?? 0) + (entry.usage?.outputTokens ?? 0);
}
const budget: Budget = {
  totalTokens: Math.max(
    localTokens,
    history.reduce((total, row) => total + row.inputTokens + row.outputTokens, 0),
  ),
  callsByAgent: new Map(),
  deadline: new Date(experiment.startedAt).getTime() + config.maxDurationMinutes * 60_000,
};
for (const row of history) budget.callsByAgent.set(row.agentId, (budget.callsByAgent.get(row.agentId) ?? 0) + 1);
for (const [agentId, calls] of localCalls)
  budget.callsByAgent.set(agentId, Math.max(calls, budget.callsByAgent.get(agentId) ?? 0));

await startDashboard(game, experimentId, config.dashboardPort);
console.log(`Dashboard: http://127.0.0.1:${config.dashboardPort}`);
console.log(`Experiment: ${experimentId}`);

const participants = await Promise.all(
  promptFiles.map(async ({ profile, instructions }) => {
    const suffix = sha(`${key}:${profile.key}`).slice(0, 7);
    const nickname = `AI_${profile.key.replaceAll('-', '').slice(0, 7)}_${suffix}`;
    const agent = await game.createAgent(experimentId, { profileKey: profile.key, slot: 1, nickname });
    return { ...agent, profile, instructions };
  }),
);
if (resumeTechnical) {
  for (const participant of participants) {
    const state = await game.state(experimentId, participant.agentId);
    if (state.terminalReason === 'technical_stop') await game.resume(experimentId, participant.agentId);
  }
}
const outcomes = await Promise.allSettled(
  participants.map(({ agentId, profile, instructions }) =>
    runAgent({ experimentId, agentId, profile, instructions, config, game, model, budget, log }),
  ),
);
for (const [index, outcome] of outcomes.entries()) {
  if (outcome.status === 'rejected') console.error(`${participants[index]?.profile.key}:`, outcome.reason);
}
await game.finish(experimentId);
console.log('Запуск завершён. Dashboard остаётся доступен до Ctrl+C.');
