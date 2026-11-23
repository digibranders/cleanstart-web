import {
  type BreakdownRow,
  type BucketPoint,
  type DealKpis,
  type DealSeries,
  type ExpiringRow,
  type MonthPoint,
  REPORTING_CURRENCY,
  type ReasonRow,
  type StatusCounts,
  type TopDealRow,
  type WeekPoint,
} from '@/lib/dashboard-dto';
import { addDays, businessDaysBetween, daysBetween } from '@/lib/dates';
import { EXPIRING_SOON_DAYS, isOverSla, REVIEW_SLA_BUSINESS_DAYS } from '@/lib/deal-rules';
import { type DealRegion, type Product, REGISTRATION_STATUSES, type RegistrationStatus } from '@/lib/domain';

/** One registration reduced to the columns the dashboards need. Dates are YYYY-MM-DD. */
export interface DealFact {
  id: string;
  partnerId: string;
  partnerName: string;
  customer: string;
  product: Product;
  region: DealRegion;
  country: string | null;
  industry: string | null;
  stage: string;
  status: RegistrationStatus;
  value: number | null;
  currency: string;
  registeredOn: string;
  resubmittedOn: string | null;
  decidedOn: string | null;
  rejectionReason: string | null;
  protectionEnd: string | null;
  registeredBy: string | null;
  managerId: string | null;
}

/** Pure helpers: rows in, numbers out. No database, no clock; every date comes in as an argument. */

const UNKNOWN = 'Not given';
const dollars = (d: DealFact): number => (d.currency === REPORTING_CURRENCY && d.value !== null ? d.value : 0);
const sum = (rows: readonly DealFact[]): number => rows.reduce((n, d) => n + dollars(d), 0);
const round1 = (n: number): number => Math.round(n * 10) / 10;

export const isOpenPipeline = (d: DealFact): boolean => d.status === 'pending' || d.status === 'accepted';

export function statusCounts(deals: readonly DealFact[]): StatusCounts {
  const counts = Object.fromEntries(REGISTRATION_STATUSES.map((s) => [s, 0])) as StatusCounts;
  for (const d of deals) counts[d.status] += 1;
  return counts;
}

/** Count and pipeline value (pending plus accepted deals) per key, biggest value first, then biggest count, then name. */
export function pipelineBy(deals: readonly DealFact[], key: (d: DealFact) => string | null): BreakdownRow[] {
  const groups = new Map<string, BreakdownRow>();
  for (const d of deals.filter(isOpenPipeline)) {
    const k = key(d)?.trim() || UNKNOWN;
    const row = groups.get(k) ?? { key: k, count: 0, value: 0 };
    row.count += 1;
    row.value += dollars(d);
    groups.set(k, row);
  }
  return [...groups.values()].sort((a, b) => b.value - a.value || b.count - a.count || a.key.localeCompare(b.key));
}

/** Registrations per calendar month for the 12 months ending with the month of `today`, zero filled, oldest first. */
export function monthlyRegistrations(deals: readonly DealFact[], today: string, months = 12): MonthPoint[] {
  const [year = 1970, month = 1] = today.split('-').map(Number);
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const index = year * 12 + (month - 1) - i;
    points.push({ month: `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`, count: 0, value: 0 });
  }
  const byMonth = new Map(points.map((p) => [p.month, p]));
  for (const d of deals) {
    const point = byMonth.get(d.registeredOn.slice(0, 7));
    if (!point) continue;
    point.count += 1;
    point.value += dollars(d);
  }
  return points;
}

const mondayOf = (iso: string): string => addDays(iso, -((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7));
const MAX_WEEKS = 53;

/** Registered (submitted) and decided deals per Monday-start week from the week of `from` to the week of `to`, zero filled. */
export function weeklySubmittedVsDecided(deals: readonly DealFact[], from: string, to: string): WeekPoint[] {
  const last = mondayOf(to);
  const first = [mondayOf(from), addDays(last, -(MAX_WEEKS - 1) * 7)].reduce((a, b) => (a > b ? a : b));
  const weeks: WeekPoint[] = [];
  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 7)) weeks.push({ weekStart: cursor, submitted: 0, decided: 0 });
  const byWeek = new Map(weeks.map((w) => [w.weekStart, w]));
  for (const d of deals) {
    const sent = byWeek.get(mondayOf(d.registeredOn));
    if (sent) sent.submitted += 1;
    const decided = d.decidedOn ? byWeek.get(mondayOf(d.decidedOn)) : undefined;
    if (decided) decided.decided += 1;
  }
  return weeks;
}

/** Won over won plus lost, 0 to 1. Null when no deal has been won or lost. */
export function winRate(deals: readonly DealFact[]): number | null {
  const won = deals.filter((d) => d.status === 'won').length;
  const lost = deals.filter((d) => d.status === 'lost').length;
  return won + lost === 0 ? null : won / (won + lost);
}

/** Business days from the latest send (resubmission or registration) to the decision, for every decided deal. */
export function decisionDays(deals: readonly DealFact[]): number[] {
  return deals.flatMap((d) => (d.decidedOn ? [businessDaysBetween(d.resubmittedOn ?? d.registeredOn, d.decidedOn)] : []));
}

export const average = (values: readonly number[]): number | null => (values.length === 0 ? null : round1(values.reduce((a, b) => a + b, 0) / values.length));

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[mid] ?? 0) : round1(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

/** Share (0 to 1) of decided deals decided within the review target. Null when nothing is decided. */
export function shareWithinTarget(days: readonly number[]): number | null {
  return days.length === 0 ? null : days.filter((n) => n <= REVIEW_SLA_BUSINESS_DAYS).length / days.length;
}

const BUCKETS: ReadonlyArray<{ label: string; max: number }> = [
  { label: 'Same day', max: 0 },
  { label: '1 day', max: 1 },
  { label: '2 days', max: 2 },
  { label: '3 to 5 days', max: 5 },
  { label: '6 days or more', max: Number.POSITIVE_INFINITY },
];

/** How long decisions took, in business days, as five fixed buckets (always all five, in order). */
export function approvalTimeBuckets(days: readonly number[]): BucketPoint[] {
  const out = BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const n of days) {
    const index = BUCKETS.findIndex((b) => n <= b.max);
    const bucket = out[index];
    if (bucket) bucket.count += 1;
  }
  return out;
}

/** Rejection reasons, trimmed and grouped case-insensitively, most common first. */
export function rejectionReasons(deals: readonly DealFact[]): ReasonRow[] {
  const groups = new Map<string, ReasonRow>();
  for (const d of deals) {
    const reason = d.rejectionReason?.trim();
    if (d.status !== 'rejected' || !reason) continue;
    const key = reason.toLowerCase();
    const row = groups.get(key) ?? { reason, count: 0 };
    row.count += 1;
    groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}

/** The biggest live deals (pending, accepted, won) with a value in the reporting currency. */
export function topDeals(deals: readonly DealFact[], limit = 5): TopDealRow[] {
  return deals
    .filter((d) => d.status !== 'rejected' && d.status !== 'lost' && d.status !== 'expired' && dollars(d) > 0)
    .sort((a, b) => dollars(b) - dollars(a) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((d) => ({ id: d.id, partnerId: d.partnerId, partnerName: d.partnerName, customer: d.customer, product: d.product, region: d.region, status: d.status, value: dollars(d) }));
}

/** Accepted deals whose protection ends from today to 14 days ahead, soonest first. */
export function expiringSoon(deals: readonly DealFact[], today: string): ExpiringRow[] {
  const horizon = addDays(today, EXPIRING_SOON_DAYS);
  return deals
    .filter((d) => d.status === 'accepted' && d.protectionEnd !== null && d.protectionEnd >= today && d.protectionEnd <= horizon)
    .sort((a, b) => (a.protectionEnd ?? '').localeCompare(b.protectionEnd ?? '') || a.id.localeCompare(b.id))
    .map((d) => ({ id: d.id, partnerId: d.partnerId, customer: d.customer, partnerName: d.partnerName, protectionEnd: d.protectionEnd ?? today, daysLeft: daysBetween(today, d.protectionEnd ?? today) }));
}

/** Accepted deals still under protection (no end date counts as protected). */
export function protectedCount(deals: readonly DealFact[], today: string): number {
  return deals.filter((d) => d.status === 'accepted' && (d.protectionEnd === null || d.protectionEnd >= today)).length;
}

/** The headline numbers for the deals in range. */
export function dealKpis(deals: readonly DealFact[]): DealKpis {
  const days = decisionDays(deals);
  const open = deals.filter(isOpenPipeline);
  const won = deals.filter((d) => d.status === 'won');
  return {
    statusCounts: statusCounts(deals),
    pipeline: { count: open.length, value: sum(open) },
    won: { count: won.length, value: sum(won) },
    winRate: winRate(deals),
    avgDecisionDays: average(days),
    medianDecisionDays: median(days),
    decidedWithinTarget: shareWithinTarget(days),
    otherCurrencyDeals: deals.filter((d) => d.currency !== REPORTING_CURRENCY && d.value !== null).length,
  };
}

/** Every chart series for the deals in range. `all` is the same filters without the period, for the 12 month trend. */
export function dealSeries(inRange: readonly DealFact[], all: readonly DealFact[], range: { from: string; to: string }): DealSeries {
  return {
    byProduct: pipelineBy(inRange, (d) => d.product),
    byRegion: pipelineBy(inRange, (d) => d.region),
    byCountry: pipelineBy(inRange, (d) => d.country),
    byIndustry: pipelineBy(inRange, (d) => d.industry),
    byStage: pipelineBy(inRange, (d) => d.stage),
    monthly: monthlyRegistrations(all, range.to),
    weekly: weeklySubmittedVsDecided(inRange, range.from, range.to),
    approvalTime: approvalTimeBuckets(decisionDays(inRange)),
    rejectionReasons: rejectionReasons(inRange),
    topDeals: topDeals(inRange),
  };
}

export interface PartnerTotals {
  deals: number;
  pipelineValue: number;
  wonCount: number;
  wonValue: number;
}

/** Deals, open pipeline value and won totals per partner id. */
export function partnerTotals(deals: readonly DealFact[]): Map<string, PartnerTotals> {
  const out = new Map<string, PartnerTotals>();
  for (const d of deals) {
    const row = out.get(d.partnerId) ?? { deals: 0, pipelineValue: 0, wonCount: 0, wonValue: 0 };
    row.deals += 1;
    if (isOpenPipeline(d)) row.pipelineValue += dollars(d);
    if (d.status === 'won') {
      row.wonCount += 1;
      row.wonValue += dollars(d);
    }
    out.set(d.partnerId, row);
  }
  return out;
}

export interface ManagerCounts {
  managerId: string | null;
  waiting: number;
  overdue: number;
  decided: number;
}

/** Per manager (null for unassigned): deals waiting and overdue now (`all`), deals decided in range (`inRange`). Busiest first. */
export function managerWorkload(all: readonly DealFact[], inRange: readonly DealFact[], today: string): ManagerCounts[] {
  const out = new Map<string | null, ManagerCounts>();
  const row = (id: string | null): ManagerCounts => {
    const found = out.get(id) ?? { managerId: id, waiting: 0, overdue: 0, decided: 0 };
    out.set(id, found);
    return found;
  };
  for (const d of all) {
    if (d.status !== 'pending') continue;
    const r = row(d.managerId);
    r.waiting += 1;
    if (isOverSla(d.resubmittedOn ?? d.registeredOn, today)) r.overdue += 1;
  }
  for (const d of inRange) if (d.decidedOn) row(d.managerId).decided += 1;
  return [...out.values()].sort((a, b) => b.waiting - a.waiting || b.decided - a.decided || (a.managerId ?? '').localeCompare(b.managerId ?? ''));
}

