import type { Endpoint, Where } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { type AttributionLeadRow, aggregateLeads } from '../lib/lead-attribution/aggregate';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

/** Page size + hard cap for the aggregation scan. 100 pages × 500 = 50k leads;
 * bigger windows should narrow the date range rather than scan unbounded. */
const PAGE_SIZE = 500;
const HARD_CAP_PAGES = 100;

const buildWhere = (params: URLSearchParams): Where => {
  const conditions: Where[] = [];
  const since = params.get('since');
  if (since) conditions.push({ createdAt: { greater_than_equal: since } });
  const until = params.get('until');
  if (until) {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(until);
    if (isDateOnly) {
      const next = new Date(`${until}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000;
      conditions.push({ createdAt: { less_than: new Date(next).toISOString() } });
    } else {
      conditions.push({ createdAt: { less_than_equal: until } });
    }
  }
  // Exclude honeypot-flagged bot submissions from marketing analytics.
  conditions.push({ honeypot: { equals: null } });
  if (conditions.length === 1) return conditions[0] as Where;
  return { and: conditions };
};

/**
 * GET /api/lead-attribution
 *
 * Admin / editor only. Aggregates the `leads` collection over an optional
 * `since` / `until` (UTC) window into the marketing attribution report:
 * leads by channel / utm source / medium / campaign / landing page / form,
 * first-vs-last-touch source, and a daily trend. Read-only; never returns
 * PII (only counts + campaign keys cross the boundary).
 */
export const leadAttributionEndpoint: Endpoint = {
  path: '/lead-attribution',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const url = new URL(req.url ?? '', 'http://internal');
    const where = buildWhere(url.searchParams);

    const rows: AttributionLeadRow[] = [];
    let page = 1;
    let truncated = false;
    while (true) {
      const result = await req.payload.find({
        collection: 'leads',
        where,
        limit: PAGE_SIZE,
        page,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: true,
      });
      for (const doc of result.docs) {
        const row = doc as {
          createdAt: string;
          form?: AttributionLeadRow['form'];
          utm?: AttributionLeadRow['utm'];
          attribution?: AttributionLeadRow['attribution'];
        };
        rows.push({
          createdAt: row.createdAt,
          form: row.form ?? null,
          utm: row.utm ?? null,
          attribution: row.attribution ?? null,
        });
      }
      if (!result.hasNextPage) break;
      page += 1;
      if (page > HARD_CAP_PAGES) {
        truncated = true;
        break;
      }
    }

    return json({
      ok: true,
      range: {
        since: url.searchParams.get('since'),
        until: url.searchParams.get('until'),
      },
      truncated,
      report: aggregateLeads(rows),
    });
  },
};
