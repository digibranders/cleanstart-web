import { EVENT_SOURCE_LABEL } from '@/lib/domain';
import { fmtLong } from '@/lib/dates';
import type { AuditEntryDto } from '@/lib/dto';

const HEADER = ['When', 'Who', 'Role', 'Action', 'On', 'Source', 'Details'] as const;

/**
 * A cell that starts with = + - @ or a control character is read as a formula by Excel and Sheets. Partner names
 * and notes are typed by visitors, so such a cell gets a leading apostrophe instead of being able to run.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
};

/** "6 Nov 2026, 14:02" in UTC, the same text the drawer shows. */
export const fullTimestamp = (iso: string): string => `${fmtLong(iso)}, ${iso.slice(11, 16)}`;

export function auditToCsv(rows: readonly AuditEntryDto[]): string {
  const lines = rows.map((e) =>
    [
      fullTimestamp(e.at),
      e.actorLabel,
      e.actorRole ?? '',
      e.action,
      e.target,
      EVENT_SOURCE_LABEL[e.source],
      e.note ?? '',
    ]
      .map(csvCell)
      .join(','),
  );
  return [HEADER.map(csvCell).join(','), ...lines].join('\n');
}
