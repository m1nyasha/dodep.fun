import { describe, expect, it } from 'vitest';
import { exportUrl } from '../export';

describe('exportUrl', () => {
  it('builds the admin export URL and skips empty filters', () => {
    expect(exportUrl({ kind: 'rounds', format: 'csv' })).toBe('/api/admin/export?kind=rounds&format=csv');
    expect(
      exportUrl({ kind: 'actions', format: 'json', isAi: 'true', from: '2026-10-01', to: '', experimentId: undefined }),
    ).toBe('/api/admin/export?kind=actions&format=json&isAi=true&from=2026-10-01');
  });
});
