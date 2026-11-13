import { addDays, businessDaysBetween, daysBetween } from './dates';
import type { Product } from './domain';

/** Protection runs this many days counting the acceptance day: accepted 5 Nov, end 2 Feb (5 Nov + 89 days). */
export const PROTECTION_DAYS = 90;
/** CleanStart decides within this many business days (Monday to Friday, no holiday calendar). */
export const REVIEW_SLA_BUSINESS_DAYS = 2;
/** One extension, 30 days. The proposal's reference vendor (Check Point) uses one 30 day extension; the core team confirms. */
export const EXTENSION_DAYS = 30;
export const MAX_EXTENSIONS = 1;
/** Reminder emails go out this many days before protection_end. */
export const EXPIRY_REMINDER_DAYS = [14, 3] as const;
/** The "Expiring in 14 days" figures on the Overview and Reports screens. */
export const EXPIRING_SOON_DAYS = 14;
/** The staff undo button on a fresh decision. */
export const UNDO_WINDOW_MINUTES = 10;
/** Decisions in the "last 7 days" counters on the approvals screen. */
export const RECENT_DECISION_DAYS = 7;
export const PRODUCT_LIST: readonly Product[] = ['images', 'libraries', 'cleansight'];

export const protectionEndFor = (acceptedOn: string): string => addDays(acceptedOn, PROTECTION_DAYS - 1);
export const acceptedOnFor = (protectionEnd: string): string => addDays(protectionEnd, -(PROTECTION_DAYS - 1));
export const extendedEnd = (currentEnd: string): string => addDays(currentEnd, EXTENSION_DAYS);
export const waitingBusinessDays = (since: string, today: string): number => businessDaysBetween(since, today);
export const isOverSla = (since: string, today: string): boolean => businessDaysBetween(since, today) > REVIEW_SLA_BUSINESS_DAYS;
export const daysUntil = (endIso: string, today: string): number => daysBetween(today, endIso);
