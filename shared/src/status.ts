export const STATUS_MAX = 72;

export function normalizeStatus(text: string): string {
  return text
    .replace(/(https?:\/\/|www\.)\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, STATUS_MAX)
    .trim();
}
