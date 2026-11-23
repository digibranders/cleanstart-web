import { daysBetween } from './dates';
import { type ReportFact, type ReportRange, summarize } from './report-metrics';

/* Pure math behind the Reports insight cards: time to decision, rejection reasons, document engagement, region and manager rollups. */

/** The p-th percentile (0 to 100) by linear interpolation, or null for no values. One value is every percentile of itself. */
export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const at = (Math.min(100, Math.max(0, p)) / 100) * (sorted.length - 1);
  const low = Math.floor(at);
  const high = Math.ceil(at);
  const a = sorted[low] ?? 0;
  const b = sorted[high] ?? a;
  return a + (b - a) * (at - low);
}

/** One registration for the insight cards: the report fact plus who manages the partner and how it was decided. */
export interface InsightFact extends ReportFact {
  partnerRegion: string;
  managerId: string | null;
  managerName: string | null;
  /** YYYY-MM-DD the deal was last put back for review after a rejection, or null. A resubmit clears the decision, so the clock restarts here. */
  resubmittedOn: string | null;
  /** YYYY-MM-DD of the decision on the current submission (accepted or rejected), or null while pending. */
  decidedOn: string | null;
  rejectionReason: string | null;
}

export interface DecisionMonth {
  /** YYYY-MM of the day the deal was submitted. */
  month: string;
  decided: number;
  median: number | null;
  p90: number | null;
}

export interface TimeToDecision {
  decided: number;
  /** Deals in the range still waiting for a first decision. */
  waiting: number;
  median: number | null;
  p90: number | null;
  byMonth: DecisionMonth[];
}

const round1 = (n: number | null): number | null => (n === null ? null : Math.round(n * 10) / 10);

/**
 * Whole days from submission to decision, never negative. A rejected deal that is resubmitted loses its decision and gets a
 * new one, so the days run from the resubmission to that later decision (the same start the SLA clock uses). Median and
 * 90th percentile overall and per month of that start day.
 */
export function timeToDecision(facts: readonly InsightFact[]): TimeToDecision {
  const months = new Map<string, number[]>();
  const all: number[] = [];
  for (const d of facts) {
    if (d.decidedOn === null) continue;
    const start = d.resubmittedOn ?? d.registeredOn;
    const days = Math.max(0, daysBetween(start, d.decidedOn));
    all.push(days);
    const key = start.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), days]);
  }
  return {
    decided: all.length,
    waiting: facts.length - all.length,
    median: round1(percentile(all, 50)),
    p90: round1(percentile(all, 90)),
    byMonth: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, days]) => ({ month, decided: days.length, median: round1(percentile(days, 50)), p90: round1(percentile(days, 90)) })),
  };
}

export const NO_REASON = 'No reason recorded';

export interface ReasonRow {
  reason: string;
  count: number;
  /** Fraction of all rejected deals in the range. */
  share: number;
}

/** Rejected deals grouped by reason, ignoring case and spacing; the most common wording names the group. Biggest first. */
export function rejectionReasons(facts: readonly InsightFact[]): ReasonRow[] {
  const groups = new Map<string, Map<string, number>>();
  let total = 0;
  for (const d of facts) {
    if (d.status !== 'rejected') continue;
    total += 1;
    const text = (d.rejectionReason ?? '').trim().replace(/\s+/g, ' ') || NO_REASON;
    const key = text.toLowerCase();
    const wording = groups.get(key) ?? new Map<string, number>();
    wording.set(text, (wording.get(text) ?? 0) + 1);
    groups.set(key, wording);
  }
  return [...groups.values()]
    .map((wording) => {
      const count = [...wording.values()].reduce((n, c) => n + c, 0);
      const [reason = NO_REASON] = [...wording.entries()].sort(([, a], [, b]) => b - a)[0] ?? [];
      return { reason, count, share: count / total };
    })
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}

export interface RollupRow {
  key: string;
  label: string;
  /** A second line under the label, such as the regions a manager covers. */
  detail: string;
  deals: number;
  won: number;
  wonValue: number;
  winRate: number | null;
}

export interface RollupGroup {
  key: string;
  label: string;
  detail?: string;
}

/**
 * Deals, won value and win rate per group. `seeds` are groups that show even with no deals (a region nobody registered in,
 * a manager with no partners yet); a deal whose group is not seeded adds its own. Most won value first.
 */
export function rollup(facts: readonly InsightFact[], keyOf: (d: InsightFact) => RollupGroup, seeds: readonly RollupGroup[] = []): RollupRow[] {
  const groups = new Map<string, { group: RollupGroup; facts: InsightFact[] }>();
  for (const seed of seeds) groups.set(seed.key, { group: seed, facts: [] });
  for (const d of facts) {
    const group = keyOf(d);
    const entry = groups.get(group.key) ?? { group, facts: [] };
    entry.facts.push(d);
    groups.set(group.key, entry);
  }
  return [...groups.values()]
    .map(({ group, facts: own }) => {
      const s = summarize(own);
      return { key: group.key, label: group.label, detail: group.detail ?? '', deals: s.deals, won: s.won, wonValue: s.wonValue, winRate: s.winRate };
    })
    .sort((a, b) => b.wonValue - a.wonValue || b.deals - a.deals || a.label.localeCompare(b.label));
}

/** Per partner region, every seeded region included. `regionName` turns a key into its display name. */
export const byRegion = (facts: readonly InsightFact[], regionName: (key: string) => string, seeds: readonly RollupGroup[] = []): RollupRow[] =>
  rollup(facts, (d) => ({ key: d.partnerRegion, label: regionName(d.partnerRegion) }), seeds);

/** Per managing staff member (the manager set on the partner); partners with no manager are one group. */
export const byManager = (facts: readonly InsightFact[], seeds: readonly RollupGroup[] = []): RollupRow[] =>
  rollup(facts, (d) => (d.managerId ? { key: d.managerId, label: d.managerName ?? 'Unnamed' } : { key: 'none', label: 'No manager' }), seeds);

export interface DocumentOpenRow {
  documentId: string;
  title: string;
  opens: number;
  partners: number;
}

export interface DocumentEngagement {
  /** Partners in scope that are onboarding or active. */
  partners: number;
  /** Of those, how many opened at least one document in the range. */
  openedAny: number;
  /** openedAny over partners, or null with no partners. */
  share: number | null;
  top: DocumentOpenRow[];
}

export const engagementShare = (openedAny: number, partners: number): number | null => (partners === 0 ? null : openedAny / partners);

export interface ReportInsightsDto {
  range: ReportRange;
  decision: TimeToDecision;
  reasons: ReasonRow[];
  engagement: DocumentEngagement;
  regions: RollupRow[];
  managers: RollupRow[];
}
