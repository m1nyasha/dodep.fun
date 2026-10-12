import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dockerArgs, imageRef, resolveServices } from '../docker-args.mjs';

describe('imageRef', () => {
  it('prefixes the registry when set', () => {
    assert.equal(imageRef('reg.example.ru', 'dodep-api', 'v1'), 'reg.example.ru/dodep-api:v1');
    assert.equal(imageRef('', 'dodep-api', 'v1'), 'dodep-api:v1');
  });
});

describe('resolveServices', () => {
  it('expands all and keeps a single service', () => {
    assert.deepEqual(resolveServices(), ['api', 'app', 'admin']);
    assert.deepEqual(resolveServices('all'), ['api', 'app', 'admin']);
    assert.deepEqual(resolveServices('app'), ['app']);
  });

  it('rejects unknown services', () => {
    assert.throws(() => resolveServices('web'), /Unknown service "web"/);
  });
});

describe('dockerArgs', () => {
  const env = { REGISTRY: 'reg.example.ru', PLATFORM: 'linux/arm64' };

  it('builds locally with tag, latest and release', () => {
    assert.deepEqual(dockerArgs({ command: 'build', service: 'api', env, tag: 'abc123' }), [
      'build',
      '--platform', 'linux/arm64',
      '-f', 'docker/Dockerfile',
      '--target', 'api',
      '-t', 'reg.example.ru/dodep-api:abc123',
      '-t', 'reg.example.ru/dodep-api:latest',
      '--build-arg', 'SENTRY_RELEASE=abc123',
      '.',
    ]);
  });

  it('pushes through buildx', () => {
    const args = dockerArgs({ command: 'push', service: 'app', env: { REGISTRY: 'r' }, tag: 'v1' });
    assert.deepEqual(args.slice(0, 4), ['buildx', 'build', '--platform', 'linux/amd64']);
    assert.equal(args.at(-2), '--push');
    assert.equal(args.at(-1), '.');
  });

  it('respects image name overrides', () => {
    const args = dockerArgs({ command: 'build', service: 'app', env: { IMAGE_APP: 'custom-app' }, tag: 't' });
    assert.ok(args.includes('custom-app:t'));
  });

  it('bakes Sentry settings only into admin', () => {
    const withDsn = { ADMIN_SENTRY_DSN: 'https://k@bugsink/2', SENTRY_ENVIRONMENT: 'production', ADMIN_SITE_URL: 'https://dodep.fun' };
    const admin = dockerArgs({ command: 'build', service: 'admin', env: withDsn, tag: 't' });
    assert.ok(admin.includes('NUXT_PUBLIC_SENTRY_DSN=https://k@bugsink/2'));
    assert.ok(admin.includes('NUXT_PUBLIC_SENTRY_ENVIRONMENT=production'));
    assert.ok(admin.includes('NUXT_PUBLIC_SITE_URL=https://dodep.fun'));
    const app = dockerArgs({ command: 'build', service: 'app', env: withDsn, tag: 't' });
    assert.ok(!app.some((a) => a.startsWith('NUXT_PUBLIC_SENTRY_DSN')));
  });
});
