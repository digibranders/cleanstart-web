import { WINDOW_DAYS, buildGa4DimensionFilter } from '../../dashboards/overview-filters';
import type { Ga4OverviewPayload, OverviewWindow } from '../../dashboards/overview-types';
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

export const shapeGa4Overview = (window: OverviewWindow, batch: GaBatch): Ga4OverviewPayload => {
  const reports = batch.reports ?? [];
  const totalsRow = reports[0]?.rows?.[0]?.metricValues ?? [];
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
    topPages: (reports[2]?.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
      views: num(r.metricValues?.[1]?.value),
    })),
    topCountries: (reports[3]?.rows ?? []).map((r) => ({
      country: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
    })),
  };
};

export const fetchGa4Overview = async (
  creds: Ga4Credentials,
  filters: { window: OverviewWindow; country: string | null; collection: string | null },
  pathPrefix: string | null,
): Promise<Ga4OverviewPayload> => {
  const client = buildClient(creds);
  const property = `properties/${creds.propertyId}`;
  const range = [{ startDate: `${WINDOW_DAYS[filters.window]}daysAgo`, endDate: 'today' }];
  const dim = buildGa4DimensionFilter(filters.country, pathPrefix);
  const withFilter = <T extends object>(req: T): T => (dim ? { ...req, dimensionFilter: dim } : req);
  const [resp] = await client.batchRunReports({
    property,
    requests: [
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
    ],
  });
  return shapeGa4Overview(filters.window, resp as GaBatch);
};
