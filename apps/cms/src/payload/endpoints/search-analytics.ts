import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { type RateLimitConfig, checkAndRecord } from '../lib/rate-limit';

const QUERY_MAX_LEN = 200;
const LOCALE_MAX_LEN = 16;

/**
 * Search-analytics is much higher volume than lead-submit (one user
 * fires multiple queries per visit), so the budget is wider than
 * DEFAULT_RATE_LIMITS. The cap is still tight enough that a single
 * IP can't fill 50k rows in a day.
 */
export const SEARCH_ANALYTICS_RATE_LIMITS: RateLimitConfig = {
  perMinute: 60,
  perDay: 600,
};

const json = (
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): Response =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

interface AnalyticsBody {
  query?: unknown;
  resultsCount?: unknown;
  locale?: unknown;
}

const validate = (
  raw: AnalyticsBody,
): { ok: true; data: { query: string; resultsCount: number; locale: string | null } }
  | { ok: false; error: string } => {
  if (typeof raw.query !== 'string' || raw.query.trim().length === 0) {
    return { ok: false, error: 'query_required' };
  }
  const query = raw.query.trim().slice(0, QUERY_MAX_LEN);

  if (typeof raw.resultsCount !== 'number' || !Number.isFinite(raw.resultsCount)) {
    return { ok: false, error: 'resultsCount_required' };
  }
  if (raw.resultsCount < 0 || !Number.isInteger(raw.resultsCount)) {
    return { ok: false, error: 'resultsCount_invalid' };
  }
  const resultsCount = raw.resultsCount;

  let locale: string | null = null;
  if (raw.locale != null) {
    if (typeof raw.locale !== 'string') return { ok: false, error: 'locale_invalid' };
    const trimmed = raw.locale.trim();
    if (trimmed.length > 0) locale = trimmed.slice(0, LOCALE_MAX_LEN);
  }

  return { ok: true, data: { query, resultsCount, locale } };
};

/**
 * POST /api/search/analytics
 *
 * Public endpoint — the public site reports a search query plus its
 * result count back to the CMS. We log every query, but the
 * high-leverage signal is `resultsCount: 0` — editors filter on
 * those to find content gaps.
 *
 * Auth: public, but per-IP rate-limited (see SEARCH_ANALYTICS_RATE_LIMITS).
 * The IP is used in-memory for the rate-limit key only — it is never
 * persisted to the searchLog row, and neither is the User-Agent.
 * Storing them on a no-consent public endpoint was a privacy footgun.
 *
 * The collection's create access is admin-locked, so this endpoint
 * uses `overrideAccess: true` — there's no other way to write a row.
 */
export const searchAnalyticsEndpoint: Endpoint = {
  path: '/search/analytics',
  method: 'post',
  handler: async (req) => {
    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`search-analytics:${ip}`, SEARCH_ANALYTICS_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
        },
        { status: 429 },
      );
    }

    let body: AnalyticsBody;
    try {
      body = (await (req as unknown as { json?: () => Promise<unknown> }).json?.()) as AnalyticsBody;
      if (body == null || typeof body !== 'object') {
        return json({ ok: false, error: 'invalid_body' }, { status: 400 });
      }
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const checked = validate(body);
    if (!checked.ok) {
      return json({ ok: false, error: checked.error }, { status: 400 });
    }

    try {
      await req.payload.create({
        collection: 'searchLog',
        data: {
          query: checked.data.query,
          resultsCount: checked.data.resultsCount,
          ...(checked.data.locale ? { locale: checked.data.locale } : {}),
        },
        overrideAccess: true,
      });
    } catch (err) {
      req.payload.logger?.warn?.(
        { error: err instanceof Error ? err.message : String(err) },
        'searchLog create failed',
      );
      return json({ ok: false, error: 'log_failed' }, { status: 500 });
    }

    return json({ ok: true });
  },
};
