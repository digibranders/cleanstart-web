// src/lib/dates.ts. Pure. Moved from the mock's components/deals/dates.ts with the clock made explicit.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const DAY_MS = 86_400_000;

const parse = (iso: string): number => {
  const [year = 1970, month = 1, day = 1] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

export const daysBetween = (fromIso: string, toIso: string): number => Math.round((parse(toIso) - parse(fromIso)) / DAY_MS);
export const addDays = (iso: string, days: number): string => new Date(parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
/** "4 Nov" */
export const fmtShort = (iso: string): string => `${new Date(parse(iso)).getUTCDate()} ${MONTHS[new Date(parse(iso)).getUTCMonth()] ?? ''}`;
/** "4 Nov 2026" */
export const fmtLong = (iso: string): string => `${fmtShort(iso)} ${new Date(parse(iso)).getUTCFullYear()}`;
/** Days from `today` to `endIso`; negative once the date has passed. */
export const daysLeft = (endIso: string, today: string): number => daysBetween(today, endIso);
export const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;
/** Weekdays in the half open range (from, to]. Saturdays and Sundays do not count; no holiday calendar. */
export const businessDaysBetween = (fromIso: string, toIso: string): number => {
  let count = 0;
  for (let cursor = addDays(fromIso, 1); cursor <= toIso; cursor = addDays(cursor, 1)) {
    const weekday = new Date(parse(cursor)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
};
/** "Today, 14:02" style labels for timestamps, in UTC. */
export const fmtTimestamp = (iso: string, today: string): string => {
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  const lead = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : fmtShort(date);
  return `${lead}, ${time}`;
};
