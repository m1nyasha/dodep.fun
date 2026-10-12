import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Vitest 5's globalSetup runs in the main process before `test.env` is applied to workers,
// so it can't see test.env.DATABASE_URL. Set it directly here too (global-setup.ts reads it).
const databaseUrl = process.env.E2E_DATABASE_URL ?? 'mysql://dodep:dodep@localhost:3307/dodep_test';
process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: databaseUrl,
      TRUST_PROXY: '1',
      THROTTLE_LIMIT: '10000',
      ADMIN_URL: 'http://admin.test',
      COOKIE_SECURE: 'false',
    },
  },
});
