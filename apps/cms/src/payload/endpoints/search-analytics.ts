import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';

const QUERY_MAX_LEN = 200;
const LOCALE_MAX_LEN = 16;
const UA_MAX_LEN = 200;

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
 * Public endpoint — the public site (or any consumer) reports a
 * search query plus its result count back to the CMS. We log every
 * query, but the high-leverage signal is `resultsCount: 0` —
 * editors filter on those to find content gaps.
 *
 * Auth: public. We rely on the existing CORS allow-list at the
 * reverse proxy + the per-IP rate limit on the surrounding lead
 * endpoint set; if abuse becomes visible in the log the same
 * rate-limit backend can be wired in here too. (Phase G ticket.)
 *
 * The collection's create access is admin-locked, so this endpoint
 * uses `overrideAccess: true` — there's no other way to write a
 * row.
 */
export const searchAnalyticsEndpoint: Endpoint = {
  path: '/search/analytics',
  method: 'post',
  handler: async (req) => {
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

    const ip = clientIpFromHeaders(req.headers);
    const ua = req.headers.get('user-agent');
    const userAgent = ua ? ua.slice(0, UA_MAX_LEN) : null;

    try {
      await req.payload.create({
        collection: 'searchLog',
        data: {
          query: checked.data.query,
          resultsCount: checked.data.resultsCount,
          ...(checked.data.locale ? { locale: checked.data.locale } : {}),
          ...(ip ? { ip } : {}),
          ...(userAgent ? { userAgent } : {}),
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
