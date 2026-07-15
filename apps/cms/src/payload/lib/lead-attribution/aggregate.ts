import { LEAD_CHANNEL_OPTIONS } from '../lead-handlers/attribution';

/**
 * Pure aggregation for the marketing Lead-Attribution dashboard. Kept free of
 * Payload so it is unit-testable: the endpoint fetches lead rows, maps them to
 * `AttributionLeadRow`, and hands them here. Grouping/counting follows the
 * same JS Map-reduce idiom as content-insights `rollup`.
 */

export interface AttributionLeadRow {
  createdAt: string;
  form?: { name?: string | null } | number | string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
  } | null;
  attribution?: {
    channel?: string | null;
    firstTouch?: { source?: string | null; landingPage?: string | null } | null;
  } | null;
}

export interface SplitRow {
  key: string;
  label: string;
  count: number;
}

export interface DailyPoint {
  date: string;
  count: number;
}

export interface AttributionReport {
  totalLeads: number;
  byChannel: SplitRow[];
  byUtmSource: SplitRow[];
  byUtmMedium: SplitRow[];
  byUtmCampaign: SplitRow[];
  byLandingPage: SplitRow[];
  byForm: SplitRow[];
  firstTouchSource: SplitRow[];
  lastTouchSource: SplitRow[];
  daily: DailyPoint[];
}

/** Sentinel bucket key for a missing / untagged value. */
export const NONE_KEY = '(none)';

const TOP_N = 25;

const clean = (value: string | null | undefined): string => {
  const trimmed = (value ?? '').trim();
  return trimmed.length === 0 ? NONE_KEY : trimmed;
};

const channelLabel = (value: string): string =>
  value === NONE_KEY
    ? NONE_KEY
    : (LEAD_CHANNEL_OPTIONS.find((o) => o.value === value)?.label ?? value);

const formName = (form: AttributionLeadRow['form']): string => {
  if (form != null && typeof form === 'object') return clean(form.name);
  return NONE_KEY;
};

/**
 * Count rows grouped by a string key. Returns the top-N buckets by count,
 * descending, ties broken alphabetically for deterministic output. `(none)`
 * always sorts last regardless of count so real campaigns lead the table.
 */
const rollup = (
  rows: AttributionLeadRow[],
  keyOf: (row: AttributionLeadRow) => string,
  labelOf: (key: string) => string = (k) => k,
): SplitRow[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: labelOf(key), count }))
    .sort((a, b) => {
      if (a.key === NONE_KEY) return 1;
      if (b.key === NONE_KEY) return -1;
      return b.count - a.count || a.key.localeCompare(b.key);
    })
    .slice(0, TOP_N);
};

const dayOf = (iso: string): string => {
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : NONE_KEY;
};

export function aggregateLeads(rows: AttributionLeadRow[]): AttributionReport {
  const daily = new Map<string, number>();
  for (const row of rows) {
    const day = dayOf(row.createdAt);
    if (day !== NONE_KEY) daily.set(day, (daily.get(day) ?? 0) + 1);
  }

  return {
    totalLeads: rows.length,
    byChannel: rollup(rows, (r) => clean(r.attribution?.channel), channelLabel),
    byUtmSource: rollup(rows, (r) => clean(r.utm?.source)),
    byUtmMedium: rollup(rows, (r) => clean(r.utm?.medium)),
    byUtmCampaign: rollup(rows, (r) => clean(r.utm?.campaign)),
    byLandingPage: rollup(rows, (r) => clean(r.attribution?.firstTouch?.landingPage)),
    byForm: rollup(rows, (r) => formName(r.form)),
    firstTouchSource: rollup(rows, (r) => clean(r.attribution?.firstTouch?.source)),
    lastTouchSource: rollup(rows, (r) => clean(r.utm?.source)),
    daily: [...daily.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
