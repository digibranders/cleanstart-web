// src/lib/dates.ts. Pure. Moved from the mock's components/deals/dates.ts with the clock made explicit.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const DAY_MS = 86_400_000;

const parse = (iso: string): number => {
  const [year = 1970, month = 1, day = 1] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** True for a YYYY-MM-DD that is a real calendar day. "2026-13-01" and "2026-02-30" are false, and never throw. */
export const isRealDay = (value: string | undefined): value is string => {
  if (value === undefined || !ISO_DAY.test(value)) return false;
  const at = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(at.getTime()) && at.toISOString().slice(0, 10) === value;
};

export const daysBetween = (fromIso: string, toIso: string): number => Math.round((parse(toIso) - parse(fromIso)) / DAY_MS);
export const addDays = (iso: string, days: number): string => new Date(parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
const dayMonth = (iso: string): string => `${new Date(parse(iso)).getUTCDate()} ${MONTHS[new Date(parse(iso)).getUTCMonth()] ?? ''}`;
const yearOf = (iso: string): number => new Date(parse(iso)).getUTCFullYear();
/** "4 Nov" in the current year, "4 Nov 2025" in any other. `today` defaults to the system date; pass it where a test needs a fixed clock. */
export const fmtShort = (iso: string, today: string = new Date().toISOString().slice(0, 10)): string =>
  yearOf(iso) === yearOf(today) ? dayMonth(iso) : `${dayMonth(iso)} ${yearOf(iso)}`;
/** "4 Nov 2026", always with the year. */
export const fmtLong = (iso: string): string => `${dayMonth(iso)} ${yearOf(iso)}`;
/** Days from `today` to `endIso`; negative once the date has passed. */
export const daysLeft = (endIso: string, today: string): number => daysBetween(today, endIso);
/** "60 days left" under a protection end date; the date itself is printed separately. */
export const daysLeftLabel = (days: number): string => (days < 0 ? 'Ended' : days === 0 ? 'Ends today' : `${plural(days, 'day')} left`);
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
  const lead = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : fmtShort(date, today);
  return `${lead}, ${time}`;
};
