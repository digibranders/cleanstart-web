import { google, type searchconsole_v1 } from 'googleapis';
import type { BasePayload } from 'payload';

import type { Ga4Credentials, GscCredentials } from '../integrations/credentials';
import { resolveGa4Credentials } from '../integrations/credentials';
import { buildClient } from '../integrations/kinds/ga4-data-api';
import { getGscCredentialsFromRow } from '../integrations/kinds/gsc-search-analytics';
import { findRowsOfKind } from '../integrations/kinds/types';
import { buildSnapshot, type CmsDocInput, type Ga4Row, type GscRow } from './build-snapshot';
import type { ContentSnapshot } from './types';

const RECENT_DAYS = 28;
const GSC_DAYS = 90;
const PAGE_ROW_LIMIT = 5000;

const CONTENT_COLLECTIONS = [
  'blogs',
  'guides',
  'news',
  'knowledgeBase',
  'case-studies',
  'resources',
  'events',
  'webinars',
  'podcastEpisodes',
] as const;

const num = (v: string | null | undefined): number => {
  const n = Number.parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
};

const labelsOf = (value: unknown): string[] => {
  const arr = Array.isArray(value) ? value : value == null ? [] : [value];
  return arr
    .map((v) => {
      if (typeof v !== 'object' || v === null) return null;
      const rec = v as Record<string, unknown>;
      const label = rec.name ?? rec.title ?? rec.fullName;
      return typeof label === 'string' ? label : null;
    })
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
};

const fetchGa4Pages = async (
  creds: Ga4Credentials | null,
  startDate: string,
  endDate: string,
): Promise<Ga4Row[]> => {
  if (!creds) return [];
  const client = buildClient(creds);
  const [resp] = await client.runReport({
    property: `properties/${creds.propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }],
    limit: PAGE_ROW_LIMIT,
  });
  return (resp.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    sessions: num(r.metricValues?.[0]?.value),
    users: num(r.metricValues?.[1]?.value),
    conversions: num(r.metricValues?.[2]?.value),
  }));
};

const gscClient = (creds: GscCredentials): searchconsole_v1.Searchconsole => {
  const email = creds.serviceAccountJson.client_email;
  const key = creds.serviceAccountJson.private_key;
  const auth = new google.auth.JWT({
    ...(typeof email === 'string' ? { email } : {}),
    ...(typeof key === 'string' ? { key } : {}),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
};

const fetchGscPages = async (creds: GscCredentials | null): Promise<GscRow[]> => {
  if (!creds) return [];
  const c = gscClient(creds);
  const end = new Date();
  const start = new Date(end.getTime() - GSC_DAYS * 86400000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const resp = await c.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: { startDate: fmt(start), endDate: fmt(end), dimensions: ['page'], rowLimit: PAGE_ROW_LIMIT },
  });
  return (resp.data.rows ?? []).map((r) => ({
    path: r.keys?.[0] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position ?? 0,
  }));
};

const fetchCmsDocs = async (payload: BasePayload): Promise<CmsDocInput[]> => {
  const out: CmsDocInput[] = [];
  for (const collection of CONTENT_COLLECTIONS) {
    let page = 1;
    for (;;) {
      const res = await payload
        .find({ collection, limit: 200, page, depth: 1, overrideAccess: true, pagination: true })
        .catch(() => null);
      if (!res) break;
      for (const raw of res.docs as unknown as Array<Record<string, unknown>>) {
        // Draft-enabled collections expose `_status`; collections without
        // drafts have no such field and are always live — treat missing as published.
        const status = raw._status;
        if (typeof status === 'string' && status !== 'published') continue;
        out.push({
          collection,
          id: String(raw.id),
          slug: String(raw.slug ?? ''),
          title: String(raw.title ?? raw.name ?? raw.slug ?? ''),
          authorLabels: labelsOf(raw.author ?? raw.authors),
          categoryLabels: labelsOf(raw.categories ?? raw.category),
          publishedAt: (raw.publishedAt as string | null) ?? null,
          updatedAt: (raw.updatedAt as string | null) ?? null,
        });
      }
      if (!res.hasNextPage) break;
      page += 1;
    }
  }
  return out.filter((d) => d.slug);
};

export const fetchContentSnapshot = async (payload: BasePayload): Promise<ContentSnapshot> => {
  const ga4Rows = await findRowsOfKind(payload, 'ga4DataApi');
  const gscRows = await findRowsOfKind(payload, 'gscSearchAnalyticsApi');
  const ga4Creds =
    ga4Rows
      .map((r) => resolveGa4Credentials(r as unknown as { ga4Config?: { propertyId?: string } }))
      .find((c): c is Ga4Credentials => c !== null) ?? null;
  const gscCreds =
    gscRows.map((r) => getGscCredentialsFromRow(r)).find((c): c is GscCredentials => c !== null) ?? null;

  const [ga4Recent, ga4Prior, gsc, cmsDocs] = await Promise.all([
    fetchGa4Pages(ga4Creds, `${RECENT_DAYS}daysAgo`, 'today'),
    fetchGa4Pages(ga4Creds, `${RECENT_DAYS * 2}daysAgo`, `${RECENT_DAYS + 1}daysAgo`),
    fetchGscPages(gscCreds),
    fetchCmsDocs(payload),
  ]);

  return buildSnapshot({
    capturedAt: new Date().toISOString(),
    windows: { recentDays: RECENT_DAYS, priorDays: RECENT_DAYS, gscDays: GSC_DAYS },
    cmsDocs,
    ga4Recent,
    ga4Prior,
    gsc,
  });
};
