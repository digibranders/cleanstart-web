/** The mock's "today" as an ISO date. fmtLong(TODAY) equals DEMO_TODAY in lib/demo-date.ts. */
export const TODAY = "2026-11-06";
/** The clock time of the mock's "now", used on messages and sync stamps. */
export const NOW_TIME = "14:02";
/** Days of protection after CleanStart accepts a registration, counting the acceptance day. */
export const PROTECTION_DAYS = 90;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const DAY_MS = 86_400_000;

function parse(iso: string): number {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parse(toIso) - parse(fromIso)) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  return new Date(parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** "4 Nov" */
export function fmtShort(iso: string): string {
  const date = new Date(parse(iso));
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()] ?? ""}`;
}

/** "4 Nov 2026" */
export function fmtLong(iso: string): string {
  return `${fmtShort(iso)} ${new Date(parse(iso)).getUTCFullYear()}`;
}

export function daysLeft(endIso: string): number {
  return daysBetween(TODAY, endIso);
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
