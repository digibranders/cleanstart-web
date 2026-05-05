/**
 * Minimal RFC 4180 CSV serialiser. No external dep — we control the
 * shape of every row that gets serialised (lead JSON, not arbitrary
 * user input formatting), so a 30-line implementation is the right
 * size here.
 */

const NEEDS_QUOTING = /[",\r\n]/;

const stringify = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const escapeCell = (raw: string): string => {
  if (!NEEDS_QUOTING.test(raw)) return raw;
  return `"${raw.replaceAll('"', '""')}"`;
};

export const toCsv = (
  headers: readonly string[],
  rows: readonly Record<string, unknown>[],
): string => {
  const lines: string[] = [];
  lines.push(headers.map((h) => escapeCell(h)).join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(stringify(row[h]))).join(','));
  }
  return `${lines.join('\r\n')}\r\n`;
};
