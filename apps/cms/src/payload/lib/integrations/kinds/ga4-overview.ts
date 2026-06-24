import { computeDelta } from '../../dashboards/advanced-metrics';
import { WINDOW_DAYS, buildGa4DimensionFilter } from '../../dashboards/overview-filters';
import type { Ga4OverviewPayload, OverviewWindow, SplitRow } from '../../dashboards/overview-types';
import type { Ga4Credentials } from '../credentials';
import { buildClient } from './ga4-data-api';

const num = (v: string | null | undefined): number => {
  if (!v) return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

interface GaReport {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}
interface GaBatch {
  reports?: GaReport[];
}

const splitOf = (report: GaReport | undefined): SplitRow[] =>
  (report?.rows ?? []).map((r) => ({
    label: r.dimensionValues?.[0]?.value ?? '',
    sessions: num(r.metricValues?.[0]?.value),
  }));

export const shapeGa4Overview = (window: OverviewWindow, batch: GaBatch): Ga4OverviewPayload => {
  const reports = batch.reports ?? [];
  const totalsRow = reports[0]?.rows?.[0]?.metricValues ?? [];
  const prevRow = reports[4]?.rows?.[0]?.metricValues ?? [];

  // pagePath × date → per-page daily sessions for sparklines.
  const pageDaily = new Map<string, Array<{ date: string; sessions: number }>>();
  for (const r of reports[8]?.rows ?? []) {
    const path = r.dimensionValues?.[0]?.value ?? '';
    const date = r.dimensionValues?.[1]?.value ?? '';
    if (!path) continue;
    const arr = pageDaily.get(path) ?? [];
    arr.push({ date, sessions: num(r.metricValues?.[0]?.value) });
    pageDaily.set(path, arr);
  }

  return {
    window,
    totals: {
      sessions: num(totalsRow[0]?.value),
      totalUsers: num(totalsRow[1]?.value),
      engagementRate: num(totalsRow[2]?.value),
      conversions: num(totalsRow[3]?.value),
    },
    daily: (reports[1]?.rows ?? []).map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
    })),
    topPages: (reports[2]?.rows ?? []).map((r) => {
      const path = r.dimensionValues?.[0]?.value ?? '';
      const daily = (pageDaily.get(path) ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
      return {
        path,
        sessions: num(r.metricValues?.[0]?.value),
        views: num(r.metricValues?.[1]?.value),
        ...(daily.length > 0 ? { daily } : {}),
      };
    }),
    topCountries: (reports[3]?.rows ?? []).map((r) => ({
      country: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
    })),
    deltas: {
      sessions: computeDelta(num(totalsRow[0]?.value), num(prevRow[0]?.value)),
      totalUsers: computeDelta(num(totalsRow[1]?.value), num(prevRow[1]?.value)),
      engagementRate: computeDelta(num(totalsRow[2]?.value), num(prevRow[2]?.value)),
      conversions: computeDelta(num(totalsRow[3]?.value), num(prevRow[3]?.value)),
    },
    channels: splitOf(reports[5]),
    devices: splitOf(reports[6]),
    sources: splitOf(reports[7]),
  };
};

export const fetchGa4Overview = async (
  creds: Ga4Credentials,
  filters: { window: OverviewWindow; country: string | null; collection: string | null },
  pathPrefix: string | null,
): Promise<Ga4OverviewPayload> => {
  const client = buildClient(creds);
  const property = `properties/${creds.propertyId}`;
  const days = WINDOW_DAYS[filters.window];
  const range = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
  const prevRange = [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }];
  const dim = buildGa4DimensionFilter(filters.country, pathPrefix);
  const withFilter = <T extends object>(req: T): T => (dim ? { ...req, dimensionFilter: dim } : req);
  const split = (dimension: string) =>
    withFilter({
      property,
      dateRanges: range,
      dimensions: [{ name: dimension }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 6,
    });
  const requests = [
      withFilter({
        property,
        dateRanges: range,
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'engagementRate' },
          { name: 'conversions' },
        ],
      }),
      withFilter({
        property,
        dateRanges: range,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      withFilter({
        property,
        dateRanges: range,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),
      withFilter({
        property,
        dateRanges: range,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
      withFilter({
        property,
        dateRanges: prevRange,
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'engagementRate' },
          { name: 'conversions' },
        ],
      }),
      split('sessionDefaultChannelGroup'),
      split('deviceCategory'),
      split('sessionSource'),
      withFilter({
        property,
        dateRanges: range,
        dimensions: [{ name: 'pagePath' }, { name: 'date' }],
        metrics: [{ name: 'sessions' }],
        limit: 2000,
      }),
  ];
  // GA4 batchRunReports allows at most 5 requests per batch, so split the 9
  // reports into chunks and concatenate the responses in order (the shaper
  // indexes reports[0..8]).
  const BATCH_MAX = 5;
  const chunks: (typeof requests)[] = [];
  for (let i = 0; i < requests.length; i += BATCH_MAX) {
    chunks.push(requests.slice(i, i + BATCH_MAX));
  }
  const responses = await Promise.all(
    chunks.map((batch) => client.batchRunReports({ property, requests: batch })),
  );
  const reports = responses.flatMap(([resp]) => (resp as GaBatch).reports ?? []);
  return shapeGa4Overview(filters.window, { reports });
};
