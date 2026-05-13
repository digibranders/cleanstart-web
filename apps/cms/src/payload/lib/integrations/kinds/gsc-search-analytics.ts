import { google, type searchconsole_v1 } from 'googleapis';
import type { BasePayload } from 'payload';

import { writeCache } from '../cache';
import { resolveGscCredentials, type GscCredentials } from '../credentials';
import { findRowsOfKind, type IntegrationRow, type RefreshResult } from './types';

/**
 * GSC — Search Analytics API (Phase J2 row #17).
 *
 * Auth: shared service account JSON via `GOOGLE_APPLICATION_CREDENTIALS_JSON`
 *   env. The SA must be added as a user on the GSC property.
 * Quota: 1,200 QPM per site — daily cron + per-doc cache absorbs this.
 */

export interface GscQueryRow {
  readonly query: string;
  readonly impressions: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly position: number;
}

export interface GscGlobalPayload {
  readonly siteUrl: string;
  readonly topQueries: ReadonlyArray<GscQueryRow>;
  readonly totals: { impressions: number; clicks: number; ctr: number };
}

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

const formatDate = (d: Date): string => d.toISOString().slice(0, 10);

const buildClient = (creds: GscCredentials): searchconsole_v1.Searchconsole => {
  const email = creds.serviceAccountJson.client_email;
  const key = creds.serviceAccountJson.private_key;
  const auth = new google.auth.JWT({
    ...(typeof email === 'string' ? { email } : {}),
    ...(typeof key === 'string' ? { key } : {}),
    scopes: SCOPES,
  });
  return google.searchconsole({ version: 'v1', auth });
};

const fetchTopQueries = async (creds: GscCredentials): Promise<GscGlobalPayload> => {
  const client = buildClient(creds);
  const now = new Date();
  const end = formatDate(now);
  const start = formatDate(new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000));
  const res = await client.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: {
      startDate: start,
      endDate: end,
      dimensions: ['query'],
      rowLimit: 10,
    },
  });
  const rows = res.data.rows ?? [];
  let impressions = 0;
  let clicks = 0;
  const topQueries: GscQueryRow[] = rows.map((r) => {
    impressions += r.impressions ?? 0;
    clicks += r.clicks ?? 0;
    return {
      query: r.keys?.[0] ?? '',
      impressions: r.impressions ?? 0,
      clicks: r.clicks ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    };
  });
  return {
    siteUrl: creds.siteUrl,
    topQueries,
    totals: {
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
    },
  };
};

/** Public — used by the per-doc endpoint, not by the cron. */
export const fetchQueriesForUrl = async (
  creds: GscCredentials,
  pageUrl: string,
): Promise<ReadonlyArray<GscQueryRow>> => {
  const client = buildClient(creds);
  const now = new Date();
  const end = formatDate(now);
  const start = formatDate(new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000));
  const res = await client.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: {
      startDate: start,
      endDate: end,
      dimensions: ['query'],
      rowLimit: 10,
      dimensionFilterGroups: [
        {
          filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }],
        },
      ],
    },
  });
  return (res.data.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? '',
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
};

export const refreshGscSearchAnalytics = async (
  payload: BasePayload,
  row: IntegrationRow,
): Promise<RefreshResult> => {
  const creds = resolveGscCredentials(row as unknown as { gscConfig?: { siteUrl?: string } });
  if (!creds) {
    return { ok: false, cached: 0, error: 'missing-credentials' };
  }
  try {
    const body = await fetchTopQueries(creds);
    await writeCache(payload, 'gscSearchAnalyticsApi', 'global', 'default', body);
    return { ok: true, cached: 1 };
  } catch (err) {
    return {
      ok: false,
      cached: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

export const refreshAllGsc = async (payload: BasePayload): Promise<RefreshResult> => {
  const rows = await findRowsOfKind(payload, 'gscSearchAnalyticsApi');
  let cached = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const r = await refreshGscSearchAnalytics(payload, row);
    cached += r.cached;
    if (!r.ok && r.error) errors.push(`${row.id}: ${r.error}`);
  }
  return {
    ok: errors.length === 0,
    cached,
    ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
  };
};

/** Used by the per-document endpoint. */
export const getGscCredentialsFromRow = (row: IntegrationRow): GscCredentials | null =>
  resolveGscCredentials(row as unknown as { gscConfig?: { siteUrl?: string } });
