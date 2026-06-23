import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { BasePayload } from 'payload';

import { writeCache } from '../cache';
import { resolveGa4Credentials, type Ga4Credentials } from '../credentials';
import { findRowsOfKind, type IntegrationRow, type RefreshResult } from './types';

/**
 * GA4 Data API (Phase J2 row #15).
 *
 * Auth: service-account JSON via `GOOGLE_APPLICATION_CREDENTIALS_JSON`
 *   env var (resolved through `credentials.resolveGa4Credentials`).
 * Endpoint: `analyticsdata.googleapis.com/v1beta` via
 *   `@google-analytics/data` v5.x.
 * Quota: 200k tokens/day per property, 10 concurrent requests.
 */

export interface Ga4GlobalPayload {
  readonly sessions: number;
  readonly totalUsers: number;
  readonly conversions: number;
  readonly engagementRate: number;
  readonly daily: ReadonlyArray<{ date: string; sessions: number }>;
}

const num = (v: string | null | undefined): number => {
  if (!v) return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export const buildClient = (creds: Ga4Credentials): BetaAnalyticsDataClient => {
  const clientEmail = creds.serviceAccountJson.client_email;
  const privateKey = creds.serviceAccountJson.private_key;
  const projectId = creds.serviceAccountJson.project_id;
  return new BetaAnalyticsDataClient({
    credentials: {
      ...(typeof clientEmail === 'string' ? { client_email: clientEmail } : {}),
      ...(typeof privateKey === 'string' ? { private_key: privateKey } : {}),
    },
    ...(typeof projectId === 'string' ? { projectId } : {}),
    // Force REST/HTTP transport instead of the default gRPC. Inside the
    // instrumented `next start` runtime, OpenTelemetry/Sentry auto-
    // instrumentation breaks @grpc/grpc-js and the client throws an opaque
    // error ("undefined undefined: undefined"), even though gRPC works in a
    // plain node process. REST returns byte-identical report data and is
    // unaffected. (GSC uses `googleapis`, which is REST-only, so it never hit
    // this.)
    fallback: true,
  });
};

const fetchGlobalReport = async (creds: Ga4Credentials): Promise<Ga4GlobalPayload> => {
  const client = buildClient(creds);
  const property = `properties/${creds.propertyId}`;
  const [resp] = await client.batchRunReports({
    property,
    requests: [
      {
        property,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'conversions' },
          { name: 'engagementRate' },
        ],
      },
      {
        property,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      },
    ],
  });
  const totals = resp.reports?.[0]?.rows?.[0]?.metricValues ?? [];
  const dailyRows = resp.reports?.[1]?.rows ?? [];
  return {
    sessions: num(totals[0]?.value),
    totalUsers: num(totals[1]?.value),
    conversions: num(totals[2]?.value),
    engagementRate: num(totals[3]?.value),
    daily: dailyRows.map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
    })),
  };
};

export const refreshGa4 = async (
  payload: BasePayload,
  row: IntegrationRow,
): Promise<RefreshResult> => {
  const creds = resolveGa4Credentials(row as unknown as { ga4Config?: { propertyId?: string } });
  if (!creds) {
    return { ok: false, cached: 0, error: 'missing-credentials' };
  }
  try {
    const body = await fetchGlobalReport(creds);
    await writeCache(payload, 'ga4DataApi', 'global', 'default', body);
    return { ok: true, cached: 1 };
  } catch (err) {
    return {
      ok: false,
      cached: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

export const refreshAllGa4 = async (payload: BasePayload): Promise<RefreshResult> => {
  const rows = await findRowsOfKind(payload, 'ga4DataApi');
  let cached = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const r = await refreshGa4(payload, row);
    cached += r.cached;
    if (!r.ok && r.error) errors.push(`${row.id}: ${r.error}`);
  }
  return {
    ok: errors.length === 0,
    cached,
    ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
  };
};
