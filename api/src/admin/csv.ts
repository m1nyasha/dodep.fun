export const BOM = String.fromCharCode(0xfeff);

const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(rows: Record<string, unknown>[]): string {
  const [first] = rows;
  if (!first) return '';
  const keys = Object.keys(first);
  return [keys.join(','), ...rows.map((row) => keys.map((k) => cell(row[k])).join(','))]
    .map((line) => `${line}\r\n`)
    .join('');
}
