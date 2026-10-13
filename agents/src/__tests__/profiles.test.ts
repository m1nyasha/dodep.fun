import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { profiles } from '../profiles/index.js';

describe('agent profiles', () => {
  it('loads ten distinct characters for one experiment iteration', async () => {
    expect(profiles).toHaveLength(10);
    expect(new Set(profiles.map((profile) => profile.key)).size).toBe(10);
    expect(new Set(profiles.map((profile) => profile.title)).size).toBe(10);
    for (const profile of profiles) {
      const path = fileURLToPath(new URL(`../profiles/${profile.instructionsFile}`, import.meta.url));
      expect((await readFile(path, 'utf8')).trim().length).toBeGreaterThan(100);
    }
  });
});
