export { addDays, daysBetween, daysLeft, fmtLong, fmtShort, plural } from "@/lib/dates";
export { PROTECTION_DAYS } from "@/lib/deal-rules";
/** Mock only: data/deals.ts reads these until Wave 2 deletes it. Real code takes "today" from the server clock. */
export { NOW_TIME, TODAY } from "./mock/dates";
