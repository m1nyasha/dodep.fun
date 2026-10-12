import type { ExportParams } from '@dodep/shared';

export function exportUrl(params: ExportParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  return `/api/admin/export?${query}`;
}
