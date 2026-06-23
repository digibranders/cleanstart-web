import { google, type searchconsole_v1 } from 'googleapis';

import { WINDOW_DAYS } from '../../dashboards/overview-filters';
import type { GscOverviewPayload, OverviewWindow } from '../../dashboards/overview-types';
import type { GscCredentials } from '../credentials';

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const fmtDate = (d: Date): string => d.toISOString().slice(0, 10);

const client = (creds: GscCredentials): searchconsole_v1.Searchconsole => {
  const email = creds.serviceAccountJson.client_email;
  const key = creds.serviceAccountJson.private_key;
  const auth = new google.auth.JWT({
    ...(typeof email === 'string' ? { email } : {}),
    ...(typeof key === 'string' ? { key } : {}),
    scopes: SCOPES,
  });
  return google.searchconsole({ version: 'v1', auth });
};

export const fetchGscOverview = async (
  creds: GscCredentials,
  window: OverviewWindow,
): Promise<GscOverviewPayload> => {
  const c = client(creds);
  const now = new Date();
  const endDate = fmtDate(now);
  const startDate = fmtDate(new Date(now.getTime() - WINDOW_DAYS[window] * 86_400_000));
  const byDim = (dimensions: string[]) => ({
    siteUrl: creds.siteUrl,
    requestBody: { startDate, endDate, dimensions, rowLimit: 10 },
  });

  const [totalsR, queriesR, pagesR] = await Promise.all([
    c.searchanalytics.query({ siteUrl: creds.siteUrl, requestBody: { startDate, endDate, rowLimit: 1 } }),
    c.searchanalytics.query(byDim(['query'])),
    c.searchanalytics.query(byDim(['page'])),
  ]);

  const t = totalsR.data.rows?.[0];
  return {
    window,
    totals: {
      clicks: t?.clicks ?? 0,
      impressions: t?.impressions ?? 0,
      ctr: t?.ctr ?? 0,
      position: t?.position ?? 0,
    },
    topQueries: (queriesR.data.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })),
    topPages: (pagesR.data.rows ?? []).map((r) => ({
      path: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })),
  };
};
