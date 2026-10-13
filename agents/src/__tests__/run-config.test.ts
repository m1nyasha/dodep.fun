import { describe, expect, it } from 'vitest';
import { runConfigSchema } from '../decision.schema.js';

const config = {
  name: 'Длинный запуск',
  ruleVersion: 1,
  maxRounds: 10_000,
  modelId: 'deepseek-flash',
  maxConcurrentModelCalls: 5,
  maxModelCallsPerAgent: 250,
  maxTotalTokens: 200_000,
  maxDurationMinutes: 120,
  dashboardPort: 4400,
};

describe('runConfigSchema', () => {
  it('accepts a long experiment without the old 50-round limit', () => {
    expect(runConfigSchema.safeParse(config).success).toBe(true);
  });

  it('rejects a round count beyond the database integer range', () => {
    expect(runConfigSchema.safeParse({ ...config, maxRounds: 2_147_483_648 }).success).toBe(false);
  });

  it('accepts higher concurrency for future multi-agent runs', () => {
    expect(runConfigSchema.safeParse({ ...config, maxConcurrentModelCalls: 50 }).success).toBe(true);
  });
});
