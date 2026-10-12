import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dockerArgs, resolveServices } from './docker-args.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Shell variables win over .env: loadEnvFile never overwrites what is already set (e.g. TAG=v1 pnpm docker:push).
if (existsSync(resolve(root, '.env'))) process.loadEnvFile(resolve(root, '.env'));

const [command, target] = process.argv.slice(2);
if (command !== 'build' && command !== 'push') {
  console.error('Usage: node scripts/docker.mjs build|push [api|app|admin|all]');
  process.exit(1);
}
if (command === 'push' && !process.env.REGISTRY) {
  console.error('REGISTRY is empty: the push would go to Docker Hub. Set REGISTRY in .env.');
  process.exit(1);
}

const gitSha = () => {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
};
const tag = process.env.TAG || gitSha() || 'local';

let services;
try {
  services = resolveServices(target);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

for (const service of services) {
  const args = dockerArgs({ command, service, env: process.env, tag });
  console.log(`> docker ${args.join(' ')}`);
  const result = spawnSync('docker', args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
