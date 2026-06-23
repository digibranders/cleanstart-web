export type OverviewWindow = '7d' | '28d' | '90d';

export interface OverviewFilters {
  window: OverviewWindow;
  /** GA4 country display name, e.g. "United States". `null` = all countries. */
  country: string | null;
  /** Collection slug, e.g. "blogs". `null` = all content. */
  collection: string | null;
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
  topPages: Array<{ path: string; sessions: number; views: number }>;
  topCountries: Array<{ country: string; sessions: number }>;
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

export interface GscOverviewPayload {
  window: OverviewWindow;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
}
