import type { BasePayload } from 'payload';

import { writeCache } from '../cache';
import { resolveCloudflareCredentials, type CloudflareCredentials } from '../credentials';
import { findRowsOfKind, type IntegrationRow, type RefreshResult } from './types';

/**
 * Cloudflare Web Analytics (Phase J2 row #26).
 *
 * Auth: account API token via `CLOUDFLARE_API_TOKEN` env var. Account
 * tag comes from the row (or falls back to `CLOUDFLARE_ACCOUNT_TAG`).
 * No SDK — raw GraphQL against
 *   `https://api.cloudflare.com/client/v4/graphql`
 * Dataset: `rumPageloadEventsAdaptiveGroups` (RUM / Web Analytics).
 */

export interface CfWaCountryRow {
  readonly country: string;
  readonly pageviews: number;
}

export interface CfWaGlobalPayload {
  readonly pageviews: number;
  readonly visits: number;
  readonly topCountries: ReadonlyArray<CfWaCountryRow>;
  readonly windowDays: number;
}

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const QUERY = `
  query WebAnalytics($accountTag: string!, $since: string!, $until: string!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        total: rumPageloadEventsAdaptiveGroups(
          filter: { datetime_geq: $since, datetime_leq: $until }
          limit: 1
        ) {
          count
          sum { visits }
        }
        byCountry: rumPageloadEventsAdaptiveGroups(
          filter: { datetime_geq: $since, datetime_leq: $until }
          limit: 10
          orderBy: [count_DESC]
        ) {
          count
          dimensions { country: clientCountryName }
        }
      }
    }
  }
`;

interface CfGraphQlResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        total?: Array<{ count?: number; sum?: { visits?: number } }>;
        byCountry?: Array<{ count?: number; dimensions?: { country?: string } }>;
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

const WINDOW_DAYS = 7;

const fetchCfWa = async (creds: CloudflareCredentials): Promise<CfWaGlobalPayload> => {
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const until = now.toISOString();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creds.apiToken}`,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { accountTag: creds.accountTag, since, until },
    }),
  });
  if (!res.ok) {
    throw new Error(`Cloudflare GraphQL ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const body = (await res.json()) as CfGraphQlResponse;
  if (body.errors?.length) {
    throw new Error(`Cloudflare GraphQL errors: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  const account = body.data?.viewer?.accounts?.[0];
  const total = account?.total?.[0] ?? {};
  const byCountry = account?.byCountry ?? [];
  return {
    pageviews: total.count ?? 0,
    visits: total.sum?.visits ?? 0,
    topCountries: byCountry.map((r) => ({
      country: r.dimensions?.country ?? '—',
      pageviews: r.count ?? 0,
    })),
    windowDays: WINDOW_DAYS,
  };
};

export const refreshCloudflareWa = async (
  payload: BasePayload,
  row: IntegrationRow,
): Promise<RefreshResult> => {
  const creds = resolveCloudflareCredentials(
    row as unknown as { cloudflareConfig?: { accountTag?: string } },
  );
  if (!creds) {
    return { ok: false, cached: 0, error: 'missing-credentials' };
  }
  try {
    const body = await fetchCfWa(creds);
    await writeCache(payload, 'cloudflareWebAnalytics', 'global', 'default', body);
    return { ok: true, cached: 1 };
  } catch (err) {
    return {
      ok: false,
      cached: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

export const refreshAllCloudflareWa = async (payload: BasePayload): Promise<RefreshResult> => {
  const rows = await findRowsOfKind(payload, 'cloudflareWebAnalytics');
  let cached = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const r = await refreshCloudflareWa(payload, row);
    cached += r.cached;
    if (!r.ok && r.error) errors.push(`${row.id}: ${r.error}`);
  }
  return {
    ok: errors.length === 0,
    cached,
    ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
  };
};
