import { describe, expect, it } from 'vitest';
import { clientHash, sha256Hex, verifyRound } from '../crypto';

const HASH = '56637356d45c739eb942dbdedcf79685156e2dd36f83a4f177ddd29183fec675';

describe('crypto', () => {
  it('hashes like the server', async () => {
    expect(await sha256Hex('0,1,2,3,4:abc')).toBe(HASH);
  });

  it('verifies a revealed layout against the committed hash', async () => {
    expect(await verifyRound([4, 3, 2, 1, 0], 'abc', HASH)).toBe(true);
    expect(await verifyRound([4, 3, 2, 1, 0], 'abd', HASH)).toBe(false);
    expect(await verifyRound([0, 1, 2, 3, 5], 'abc', HASH)).toBe(false);
  });

  it('produces a stable 64-hex client fingerprint', async () => {
    const a = await clientHash();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await clientHash()).toBe(a);
  });
});
