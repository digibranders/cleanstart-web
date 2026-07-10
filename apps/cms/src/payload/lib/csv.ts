/**
 * Minimal RFC 4180 CSV serialiser. No external dep — we control the
 * shape of every row that gets serialised (lead JSON, not arbitrary
 * user input formatting), so a 30-line implementation is the right
 * size here.
 *
 * Two beyond-RFC additions:
 *   - UTF-8 BOM at the start so Excel on Windows reads the file as
 *     UTF-8 by default rather than the local code page.
 *   - Formula-injection mitigation: any cell whose first non-whitespace
 *     char is `=`, `+`, `-`, `@`, tab, or CR is prefixed with a single
 *     quote so Excel/Sheets render it as text instead of evaluating it.
 *     Visitor-supplied values flow through `toCsv`; without this an
 *     attacker can plant `=cmd|'/c calc'!A1` in their lead and have it
 *     execute when an admin opens the export in Excel.
 */

const NEEDS_QUOTING = /[",\r\n]/;
const FORMULA_TRIGGER = /^[\s ]*[=+\-@\t\r]/;
const UTF8_BOM = '﻿';

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

const neutraliseFormula = (raw: string): string => {
  if (FORMULA_TRIGGER.test(raw)) return `'${raw}`;
  return raw;
};

const escapeCell = (raw: string): string => {
  const safe = neutraliseFormula(raw);
  if (!NEEDS_QUOTING.test(safe)) return safe;
  return `"${safe.replaceAll('"', '""')}"`;
};

/**
 * `headers` are the row-lookup keys (field names). `headerLabels`, when
 * given, supplies the human-readable text for the header row instead of the
 * raw keys — used by the generic collection export so a column reads
 * "Partner Name" rather than `partnerName`. Defaults to `headers` for
 * callers (leads / partners exports) that already pass labelled headers.
 */
export const toCsv = (
  headers: readonly string[],
  rows: readonly Record<string, unknown>[],
  headerLabels?: readonly string[],
): string => {
  const labels = headerLabels ?? headers;
  const lines: string[] = [];
  lines.push(labels.map((h) => escapeCell(h)).join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(stringify(row[h]))).join(','));
  }
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
};
