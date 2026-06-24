import type { CruxPayload, CruxRecord, CwvMetric, CwvRating } from '../../dashboards/overview-types';
import type { CruxCredentials } from '../credentials';

/**
 * The public production origin to query CrUX for. Decoupled from the CMS's own
 * base URL (`resolveSiteUrl`) because that resolves to staging in non-prod
 * environments, and CrUX only has field data for the live www origin.
 */
export const resolveCruxOrigin = (): string =>
  process.env.CRUX_ORIGIN ?? 'https://www.cleanstart.com';

const rate = (v: number, good: number, poor: number): CwvRating =>
  v <= good ? 'good' : v <= poor ? 'needs-improvement' : 'poor';

export const mapMetric = (
  p75: number | undefined,
  good: number,
  poor: number,
): CwvMetric | null => (typeof p75 === 'number' ? { p75, rating: rate(p75, good, poor) } : null);

interface CruxMetricRecord {
  percentiles?: { p75?: number | string };
}

export const mapCruxRecord = (
  scope: string,
  formFactor: 'PHONE' | 'DESKTOP',
  metrics: Record<string, CruxMetricRecord>,
): CruxRecord => {
  const p75 = (key: string): number | undefined => {
    const v = metrics[key]?.percentiles?.p75;
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    scope,
    formFactor,
    lcp: mapMetric(p75('largest_contentful_paint'), 2500, 4000),
    inp: mapMetric(p75('interaction_to_next_paint'), 200, 500),
    cls: mapMetric(p75('cumulative_layout_shift'), 0.1, 0.25),
  };
};

interface CruxApiResponse {
  record?: { metrics?: Record<string, CruxMetricRecord> };
}

const FORM_FACTORS: Array<'PHONE' | 'DESKTOP'> = ['PHONE', 'DESKTOP'];

const queryOne = async (
  apiKey: string,
  target: { origin: string } | { url: string },
  formFactor: 'PHONE' | 'DESKTOP',
  scope: string,
): Promise<CruxRecord | null> => {
  const res = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...target, formFactor }),
    },
  );
  if (!res.ok) return null; // 404 = no CrUX data for this target/form-factor
  const body = (await res.json()) as CruxApiResponse;
  return mapCruxRecord(scope, formFactor, body.record?.metrics ?? {});
};

/**
 * Fetch p75 LCP/INP/CLS for the origin (both form factors) plus a bounded set
 * of page URLs. Targets with no field data are skipped (CrUX 404s).
 */
export const fetchCrux = async (
  creds: CruxCredentials,
  origin: string,
  pageUrls: string[],
): Promise<CruxPayload> => {
  const tasks: Array<Promise<CruxRecord | null>> = [];
  for (const ff of FORM_FACTORS) {
    tasks.push(queryOne(creds.apiKey, { origin }, ff, 'origin'));
    for (const url of pageUrls) {
      const path = url.replace(/^https?:\/\/[^/]+/i, '') || '/';
      tasks.push(queryOne(creds.apiKey, { url }, ff, path));
    }
  }
  const records = (await Promise.all(tasks)).filter((r): r is CruxRecord => r !== null);
  return { records };
};
