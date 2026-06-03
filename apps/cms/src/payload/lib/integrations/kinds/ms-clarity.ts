import type { BasePayload } from 'payload';

import { writeCache } from '../cache';
import { resolveClarityCredentials, type ClarityCredentials } from '../credentials';
import { findRowsOfKind, type IntegrationRow, type RefreshResult } from './types';

/**
 * Microsoft Clarity Data Export API (Phase J2 row #21).
 *
 * Auth: Bearer JWT via `CLARITY_API_TOKEN` env var. The token is
 * generated per project in Clarity → Settings → Data Export.
 * Quota: 10 requests/project/day.
 *
 * Iframe embeds and raw click-coordinate exports are not supported
 * by the Clarity API (GitHub #267, #301, #242). The L1 / L2 surfaces
 * show aggregate counts only.
 */

export interface ClarityUrlRow {
  readonly url: string;
  readonly deadClicks?: number | undefined;
  readonly rageClicks?: number | undefined;
  readonly scrollDepth?: number | undefined;
  readonly sessions?: number | undefined;
}

export interface ClarityGlobalPayload {
  readonly worstByDeadClicks: ReadonlyArray<ClarityUrlRow>;
  readonly worstByRageClicks: ReadonlyArray<ClarityUrlRow>;
  readonly totalSessions: number;
}

interface RawMetric {
  metricName: string;
  information: Array<Record<string, string | number>>;
}

const ENDPOINT = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';

const numField = (row: Record<string, string | number>, key: string): number | undefined => {
  const v = row[key];
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

const stringField = (row: Record<string, string | number>, key: string): string | undefined => {
  const v = row[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
};

const parseClarityResponse = (raw: RawMetric[]): ClarityGlobalPayload => {
  const byUrl = new Map<string, ClarityUrlRow>();
  let totalSessions = 0;

  const upsert = (url: string, patch: Partial<ClarityUrlRow>): void => {
    const existing = byUrl.get(url);
    byUrl.set(url, existing ? { ...existing, ...patch } : { url, ...patch });
  };

  for (const metric of raw) {
    for (const info of metric.information ?? []) {
      const url = stringField(info, 'URL') ?? stringField(info, 'Page');
      if (metric.metricName === 'Traffic') {
        const s = numField(info, 'totalSessionCount');
        if (typeof s === 'number') totalSessions += s;
      }
      if (!url) continue;
      if (/dead.?click/i.test(metric.metricName)) {
        upsert(url, { deadClicks: numField(info, 'count') ?? numField(info, 'totalCount') });
      } else if (/rage.?click/i.test(metric.metricName)) {
        upsert(url, { rageClicks: numField(info, 'count') ?? numField(info, 'totalCount') });
      } else if (/scroll/i.test(metric.metricName)) {
        upsert(url, { scrollDepth: numField(info, 'depth') ?? numField(info, 'value') });
      }
    }
  }

  const all = Array.from(byUrl.values());
  return {
    worstByDeadClicks: [...all]
      .filter((r) => typeof r.deadClicks === 'number' && r.deadClicks > 0)
      .sort((a, b) => (b.deadClicks ?? 0) - (a.deadClicks ?? 0))
      .slice(0, 10),
    worstByRageClicks: [...all]
      .filter((r) => typeof r.rageClicks === 'number' && r.rageClicks > 0)
      .sort((a, b) => (b.rageClicks ?? 0) - (a.rageClicks ?? 0))
      .slice(0, 10),
    totalSessions,
  };
};

const fetchClarity = async (creds: ClarityCredentials): Promise<ClarityGlobalPayload> => {
  const url = `${ENDPOINT}?numOfDays=3&dimension1=URL`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${creds.apiToken}` },
  });
  if (!res.ok) {
    throw new Error(`Clarity API ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as RawMetric[];
  return parseClarityResponse(Array.isArray(data) ? data : []);
};

export const refreshClarity = async (
  payload: BasePayload,
  _row: IntegrationRow,
): Promise<RefreshResult> => {
  const creds = resolveClarityCredentials();
  if (!creds) return { ok: false, cached: 0, error: 'missing-credentials' };
  try {
    const body = await fetchClarity(creds);
    await writeCache(payload, 'msClarity', 'global', 'default', body);
    return { ok: true, cached: 1 };
  } catch (err) {
    return {
      ok: false,
      cached: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

export const refreshAllClarity = async (payload: BasePayload): Promise<RefreshResult> => {
  const rows = await findRowsOfKind(payload, 'msClarity');
  const firstRow = rows[0];
  if (!firstRow) {
    return { ok: true, cached: 0, skipped: true, skipReason: 'no-rows-configured' };
  }

  // Clarity is a singleton env-token provider: all msClarity rows share the
  // same CLARITY_API_TOKEN and hit the same project. Running one call per
  // enabled row would waste the 10/day quota with N identical requests.
  // Call exactly once using the first enabled row as a representative.
  return refreshClarity(payload, firstRow);
};
