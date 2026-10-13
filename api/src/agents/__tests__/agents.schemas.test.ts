import { describe, expect, it } from 'vitest';
import { experimentSchema } from '../agents.schemas.js';

const experiment = {
  externalKey: 'long-run',
  name: 'Длинный запуск',
  ruleVersion: 1,
  maxRounds: 10_000,
  manifest: {},
};

describe('experimentSchema', () => {
  it('accepts a long experiment without the old 50-round limit', () => {
    expect(experimentSchema.safeParse(experiment).success).toBe(true);
  });

  it('rejects a round count beyond the database integer range', () => {
    expect(experimentSchema.safeParse({ ...experiment, maxRounds: 2_147_483_648 }).success).toBe(false);
  });
});
