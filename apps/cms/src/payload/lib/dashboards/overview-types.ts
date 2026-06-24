export type OverviewWindow = '7d' | '28d' | '90d';

export interface OverviewFilters {
  window: OverviewWindow;
  /** GA4 country display name, e.g. "United States". `null` = all countries. */
  country: string | null;
  /** Collection slug, e.g. "blogs". `null` = all content. */
  collection: string | null;
}

export interface MetricDelta {
  value: number;
  /** Percent change vs the prior period; `null` when the prior period was 0. */
  deltaPct: number | null;
}

export interface SplitRow {
  label: string;
  sessions: number;
}

export interface Ga4OverviewPayload {
  window: OverviewWindow;
  totals: {
    sessions: number;
    totalUsers: number;
    engagementRate: number;
    conversions: number;
  };
  daily: Array<{ date: string; sessions: number }>;
  topPages: Array<{
    path: string;
    sessions: number;
    views: number;
    daily?: Array<{ date: string; sessions: number }>;
  }>;
  topCountries: Array<{ country: string; sessions: number }>;
  deltas?: {
    sessions: MetricDelta;
    totalUsers: MetricDelta;
    engagementRate: MetricDelta;
    conversions: MetricDelta;
  };
  channels?: SplitRow[];
  devices?: SplitRow[];
  sources?: SplitRow[];
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PositionBucket {
  label: string;
  count: number;
}

export interface ScatterPoint {
  position: number;
  ctr: number;
  impressions: number;
}

export interface GscOverviewPayload {
  window: OverviewWindow;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
  deltas?: {
    clicks: MetricDelta;
    impressions: MetricDelta;
    ctr: MetricDelta;
    position: MetricDelta;
  };
  positionBuckets?: PositionBucket[];
  scatter?: ScatterPoint[];
}

export type CwvRating = 'good' | 'needs-improvement' | 'poor';

export interface CwvMetric {
  p75: number;
  rating: CwvRating;
}

export interface CruxRecord {
  /** 'origin' or a page path. */
  scope: string;
  formFactor: 'PHONE' | 'DESKTOP';
  lcp: CwvMetric | null;
  inp: CwvMetric | null;
  cls: CwvMetric | null;
}

export interface CruxPayload {
  records: CruxRecord[];
}

export interface RealtimePayload {
  activeUsers: number;
  byPage: Array<{ path: string; users: number }>;
}
