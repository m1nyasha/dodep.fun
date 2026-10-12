export function isDuplicateKey(e: unknown): boolean {
  const cause = (e as { cause?: { code?: string } })?.cause ?? e;
  return (cause as { code?: string })?.code === 'ER_DUP_ENTRY';
}
