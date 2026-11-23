import { addDays, isRealDay } from './dates';
import { isOneOf, PRODUCTS, type Product, type RegistrationStatus } from './domain';

/* ---------------------------------------------------------------- date range (URL state) */

export const REPORT_PRESETS = ['30d', '90d', '365d', 'quarter', 'custom'] as const;
export type ReportPreset = (typeof REPORT_PRESETS)[number];
export const DEFAULT_REPORT_PRESET: ReportPreset = '90d';
export const REPORT_PRESET_LABEL: Record<ReportPreset, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '365d': 'Last 365 days',
  quarter: 'This quarter',
  custom: 'Custom',
};

export interface ReportRange {
  preset: ReportPreset;
  /** First day, inclusive, YYYY-MM-DD. */
  from: string;
  /** Last day, inclusive, YYYY-MM-DD. */
  to: string;
}

type Params = URLSearchParams | Record<string, string | string[] | undefined>;


const pick = (params: Params, key: string): string | undefined => {
  const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === null || value === undefined ? undefined : value.trim();
};

/** The first day of the calendar quarter that holds `today`. */
export function quarterStart(today: string): string {
  const month = Number(today.slice(5, 7));
  const first = Math.floor((month - 1) / 3) * 3 + 1;
  return `${today.slice(0, 4)}-${String(first).padStart(2, '0')}-01`;
}

/** Resolves a preset (and, for custom, a from and to) to concrete days. */
export function resolveReportRange(preset: ReportPreset, today: string, custom?: { from: string; to: string }): ReportRange {
  switch (preset) {
    case '30d':
      return { preset, from: addDays(today, -29), to: today };
    case '90d':
      return { preset, from: addDays(today, -89), to: today };
    case '365d':
      return { preset, from: addDays(today, -364), to: today };
    case 'quarter':
      return { preset, from: quarterStart(today), to: today };
    case 'custom':
      return custom ? { preset, ...custom } : resolveReportRange(DEFAULT_REPORT_PRESET, today);
  }
}

/** Parses `?range=&from=&to=`. A bad preset, a malformed day or a from after the to falls back to the default preset. */
export function parseReportRange(params: Params, today: string): ReportRange {
  const preset = pick(params, 'range');
  const from = pick(params, 'from');
  const to = pick(params, 'to');
  if (preset === 'custom' || (preset === undefined && (from !== undefined || to !== undefined))) {
    return isRealDay(from) && isRealDay(to) && from <= to
      ? resolveReportRange('custom', today, { from, to })
      : resolveReportRange(DEFAULT_REPORT_PRESET, today);
  }
  return resolveReportRange(isOneOf(REPORT_PRESETS, preset) ? preset : DEFAULT_REPORT_PRESET, today);
}

/** The URL query for a range. The default preset is left out so the plain Reports URL stays clean. */
export function reportRangeQuery(range: ReportRange): string {
  if (range.preset === DEFAULT_REPORT_PRESET) return '';
  const p = new URLSearchParams({ range: range.preset });
  if (range.preset === 'custom') {
    p.set('from', range.from);
    p.set('to', range.to);
  }
  return `?${p.toString()}`;
}

/* ---------------------------------------------------------------- metrics */

/** One registration reduced to what the reports need. */
export interface ReportFact {
  partnerId: string;
  partnerName: string;
  product: Product;
  status: RegistrationStatus;
  value: number | null;
  currency: string;
  /** YYYY-MM-DD. */
  registeredOn: string;
}

/** Deal values are summed in this currency only; a deal in another currency is counted but adds no value. */
export const REPORT_CURRENCY = 'USD';

const APPROVED: readonly RegistrationStatus[] = ['accepted', 'won', 'lost', 'expired'];
const dollars = (d: ReportFact): number | null => (d.currency === REPORT_CURRENCY && d.value !== null ? d.value : null);
const sumOf = (rows: readonly ReportFact[]): number => rows.reduce((n, d) => n + (dollars(d) ?? 0), 0);

export const inRange = (facts: readonly ReportFact[], range: Pick<ReportRange, 'from' | 'to'>): ReportFact[] =>
  facts.filter((d) => d.registeredOn >= range.from && d.registeredOn <= range.to);

/** Won over won plus lost, as a fraction, or null while nothing has closed. */
export const winRate = (won: number, lost: number): number | null => (won + lost === 0 ? null : won / (won + lost));

/** Part over whole as a fraction, or null when there is no whole. */
export const conversion = (part: number, whole: number): number | null => (whole === 0 ? null : part / whole);

export interface ReportSummary {
  deals: number;
  /** Sum of USD values of every deal in the range. */
  totalValue: number;
  /** Total over the deals that carry a USD value, or null when none does. */
  averageValue: number | null;
  wonValue: number;
  won: number;
  lost: number;
  winRate: number | null;
  /** Deals left out of the value figures because they have no value or another currency. */
  unvalued: number;
}

export function summarize(facts: readonly ReportFact[]): ReportSummary {
  const valued = facts.filter((d) => dollars(d) !== null);
  const won = facts.filter((d) => d.status === 'won');
  const lost = facts.filter((d) => d.status === 'lost').length;
  const totalValue = sumOf(facts);
  return {
    deals: facts.length,
    totalValue,
    averageValue: valued.length ? totalValue / valued.length : null,
    wonValue: sumOf(won),
    won: won.length,
    lost,
    winRate: winRate(won.length, lost),
    unvalued: facts.length - valued.length,
  };
}

export interface FunnelStep {
  key: 'submitted' | 'approved' | 'won' | 'lost';
  label: string;
  count: number;
  /** Share of the step named in `from`, or null when that step is empty. */
  conversion: number | null;
  /** What `conversion` is measured against. Empty for the first step. */
  from: string;
}

/** Submitted, approved (accepted, won, lost or expired), won and lost. Won and lost are each measured against approved. */
export function funnel(facts: readonly ReportFact[]): FunnelStep[] {
  const count = (pick: (d: ReportFact) => boolean): number => facts.filter(pick).length;
  const submitted = facts.length;
  const approved = count((d) => APPROVED.includes(d.status));
  const won = count((d) => d.status === 'won');
  const lost = count((d) => d.status === 'lost');
  return [
    { key: 'submitted', label: 'Submitted', count: submitted, conversion: null, from: '' },
    { key: 'approved', label: 'Approved', count: approved, conversion: conversion(approved, submitted), from: 'submitted' },
    { key: 'won', label: 'Won', count: won, conversion: conversion(won, approved), from: 'approved' },
    { key: 'lost', label: 'Lost', count: lost, conversion: conversion(lost, approved), from: 'approved' },
  ];
}

export interface LeaderboardRow {
  partnerId: string;
  name: string;
  deals: number;
  won: number;
  wonValue: number;
}

/** Partners with at least one deal, by won value, then won count, then deals, then name. */
export function leaderboard(facts: readonly ReportFact[]): LeaderboardRow[] {
  const rows = new Map<string, LeaderboardRow>();
  for (const d of facts) {
    const row = rows.get(d.partnerId) ?? { partnerId: d.partnerId, name: d.partnerName, deals: 0, won: 0, wonValue: 0 };
    row.deals += 1;
    if (d.status === 'won') {
      row.won += 1;
      row.wonValue += dollars(d) ?? 0;
    }
    rows.set(d.partnerId, row);
  }
  return [...rows.values()].sort((a, b) => b.wonValue - a.wonValue || b.won - a.won || b.deals - a.deals || a.name.localeCompare(b.name));
}

export interface ProductRow {
  product: Product;
  deals: number;
  approved: number;
  won: number;
  totalValue: number;
  wonValue: number;
}

/** Every product, in catalogue order, zero filled. */
export function productBreakdown(facts: readonly ReportFact[]): ProductRow[] {
  return PRODUCTS.map((product) => {
    const own = facts.filter((d) => d.product === product);
    return {
      product,
      deals: own.length,
      approved: own.filter((d) => APPROVED.includes(d.status)).length,
      won: own.filter((d) => d.status === 'won').length,
      totalValue: sumOf(own),
      wonValue: sumOf(own.filter((d) => d.status === 'won')),
    };
  });
}

export interface RangedReportDto {
  range: ReportRange;
  summary: ReportSummary;
  funnel: FunnelStep[];
  leaderboard: LeaderboardRow[];
  products: ProductRow[];
}

export function buildRangedReport(facts: readonly ReportFact[], range: ReportRange): RangedReportDto {
  const own = inRange(facts, range);
  return { range, summary: summarize(own), funnel: funnel(own), leaderboard: leaderboard(own), products: productBreakdown(own) };
}
