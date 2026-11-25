import type { Endpoint, PayloadRequest } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { toCsv } from '../lib/csv';
import {
  DEFAULT_EVENT_FORM_SLUG,
  eventLeadSource,
  toSiteEvent,
  type SiteEvent,
} from '../lib/event-pages/site';
import { composeEventBanner } from '../lib/event-pages/banner';
import { extractRequestMeta } from '../lib/request-meta';

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const cmsBase = (): string => (process.env.PAYLOAD_PUBLIC_SERVER_URL ?? '').replace(/\/$/u, '');

const canManage = (req: PayloadRequest): boolean => hasAnyRole(req.user, ['admin', 'editor', 'events']);

type FormDoc = { id: number | string; slug?: string | null; submitLabel?: string | null; fields?: never[] | null };

/** The event's own form when it picked one, otherwise the default event form. */
const formFor = async (
  req: PayloadRequest,
  picked: unknown,
  defaultForm: () => Promise<FormDoc | null>,
): Promise<FormDoc | null> => {
  if (picked && typeof picked === 'object') return picked as FormDoc;
  if (typeof picked === 'number') {
    const found = await req.payload.findByID({ collection: 'forms', id: picked, depth: 0, overrideAccess: true });
    return found as unknown as FormDoc;
  }
  return defaultForm();
};

const loadDefaultForm = (req: PayloadRequest) => {
  let cached: Promise<FormDoc | null> | undefined;
  return (): Promise<FormDoc | null> => {
    cached ??= req.payload
      .find({
        collection: 'forms',
        where: { slug: { equals: DEFAULT_EVENT_FORM_SLUG } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      .then((res) => (res.docs[0] as unknown as FormDoc | undefined) ?? null);
    return cached;
  };
};

const toSite = async (
  req: PayloadRequest,
  doc: Record<string, unknown>,
  defaultForm: () => Promise<FormDoc | null>,
): Promise<SiteEvent | null> => {
  const form = await formFor(req, doc.registrationForm, defaultForm);
  if (!form) return null;
  return toSiteEvent(doc, form as never, cmsBase());
};

/** Public: published events with their form, for events.cleanstart.com. */
const siteList: Endpoint = {
  path: '/site',
  method: 'get',
  handler: async (req) => {
    const res = await req.payload.find({
      collection: 'eventPages',
      where: { _status: { equals: 'published' } },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    });
    const defaultForm = loadDefaultForm(req);
    const events = (
      await Promise.all(res.docs.map((doc) => toSite(req, doc as unknown as Record<string, unknown>, defaultForm)))
    ).filter((event): event is SiteEvent => event !== null);
    return json({ events });
  },
};

const siteOne: Endpoint = {
  path: '/site/:slug',
  method: 'get',
  handler: async (req) => {
    const slug = req.routeParams?.slug;
    if (typeof slug !== 'string') return json({ error: 'not_found' }, 404);
    const res = await req.payload.find({
      collection: 'eventPages',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });
    const doc = res.docs[0] as unknown as Record<string, unknown> | undefined;
    const event = doc ? await toSite(req, doc, loadDefaultForm(req)) : null;
    return event ? json({ event }) : json({ error: 'not_found' }, 404);
  },
};

const EVENTS_SITE = (process.env.EVENTS_SITE_URL ?? 'https://events.cleanstart.com').replace(/\/$/u, '');

const fetchImage = async (url: string): Promise<Buffer | null> => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length <= 2_000_000 ? bytes : null;
  } catch {
    return null;
  }
};

/**
 * Public: the event's co-branding strip as one PNG, for its emails. Email
 * clients do not show SVG, so the partner logos are composed into a picture
 * here. Only published events have one, and a logo that cannot be fetched is
 * left out and the result is not cached, so the next request retries it.
 */
const banner: Endpoint = {
  path: '/banner/:slug',
  method: 'get',
  handler: async (req) => {
    const slug = req.routeParams?.slug;
    if (typeof slug !== 'string') return json({ error: 'not_found' }, 404);
    const res = await req.payload.find({
      collection: 'eventPages',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });
    const doc = res.docs[0] as unknown as Record<string, unknown> | undefined;
    const event = doc ? await toSite(req, doc, loadDefaultForm(req)) : null;
    if (!event) return json({ error: 'not_found' }, 404);

    const urls = [`${EVENTS_SITE}/logos/cleanstart.png`, ...event.partners.flatMap((p) => (p.logoUrl ? [p.logoUrl] : []))];
    const fetched = await Promise.all(urls.map(fetchImage));
    const logos = fetched.filter((logo): logo is Buffer => logo !== null);
    if (logos.length === 0) return json({ error: 'no_logos' }, 404);

    const png = await composeEventBanner(logos);
    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'cache-control': logos.length === urls.length ? 'public, max-age=3600' : 'no-store',
      },
    });
  },
};

const PAGE_SIZE = 200;

type Entry = { id: number; createdAt: string; fields: Record<string, unknown> };

const loadRegistrations = async (req: PayloadRequest) => {
  const id = req.routeParams?.id;
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const event = (await req.payload
    .findByID({ collection: 'eventPages', id, depth: 1, overrideAccess: true })
    .catch(() => null)) as unknown as Record<string, unknown> | null;
  if (!event || typeof event.slug !== 'string') return null;
  const form = await formFor(req, event.registrationForm, loadDefaultForm(req));
  const columns = (form?.fields ?? []).flatMap((f: { name?: string | null; label?: string | null }) =>
    f.name ? [{ name: f.name, label: f.label?.trim() || f.name }] : [],
  );
  return { event: { id, title: String(event.title ?? ''), slug: event.slug }, columns };
};

/** Admin: one event's entries, newest first. */
const registrations: Endpoint = {
  path: '/:id/registrations',
  method: 'get',
  handler: async (req) => {
    if (!canManage(req)) return json({ ok: false, error: 'forbidden' }, 403);
    const loaded = await loadRegistrations(req);
    if (!loaded) return json({ ok: false, error: 'not_found' }, 404);
    const page = Math.max(1, Number.parseInt(new URL(req.url ?? '', 'http://internal').searchParams.get('page') ?? '1', 10) || 1);
    const res = await req.payload.find({
      collection: 'leads',
      where: { source: { equals: eventLeadSource(loaded.event.slug) } },
      sort: '-createdAt',
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    });
    const entries: Entry[] = res.docs.map((lead) => ({
      id: lead.id,
      createdAt: lead.createdAt,
      fields: (lead.fields ?? {}) as Record<string, unknown>,
    }));
    return json({ ok: true, ...loaded, entries, total: res.totalDocs, page, hasNextPage: res.hasNextPage });
  },
};

const todayStamp = (): string => new Date().toISOString().slice(0, 10);

/** Admin: every entry for one event as CSV, with an audit row like the leads export. */
const registrationsCsv: Endpoint = {
  path: '/:id/registrations-csv',
  method: 'get',
  handler: async (req) => {
    if (!canManage(req)) return json({ ok: false, error: 'forbidden' }, 403);
    const loaded = await loadRegistrations(req);
    if (!loaded) return json({ ok: false, error: 'not_found' }, 404);

    const rows: Record<string, unknown>[] = [];
    let page = 1;
    while (page <= 100) {
      const res = await req.payload.find({
        collection: 'leads',
        where: { source: { equals: eventLeadSource(loaded.event.slug) } },
        sort: 'createdAt',
        limit: PAGE_SIZE,
        page,
        depth: 0,
        overrideAccess: true,
      });
      for (const lead of res.docs) rows.push({ createdAt: lead.createdAt, ...((lead.fields ?? {}) as object) });
      if (!res.hasNextPage) break;
      page += 1;
    }

    const known = new Set(loaded.columns.map((c) => c.name));
    const extra = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((k) => k !== 'createdAt' && !known.has(k));
    const keys = ['createdAt', ...loaded.columns.map((c) => c.name), ...extra];
    const labels = ['Submitted', ...loaded.columns.map((c) => c.label), ...extra];

    try {
      const meta = extractRequestMeta(req.headers);
      const rawId = req.user ? (req.user as { id?: string | number }).id : undefined;
      const actorUserId = typeof rawId === 'number' ? rawId : rawId ? Number.parseInt(String(rawId), 10) : null;
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'lead_exported',
          targetCollection: 'leads',
          targetId: loaded.event.slug,
          actorUserId: Number.isFinite(actorUserId) ? actorUserId : null,
          requestIp: meta.ip,
          userAgent: meta.userAgent ?? null,
          acceptLanguage: meta.acceptLanguage ?? null,
          proxyChainLength: meta.proxyChainLength,
          metadata: { rowCount: rows.length, event: loaded.event.slug },
        },
        overrideAccess: true,
      });
    } catch (error) {
      req.payload.logger?.error?.(
        { err: error instanceof Error ? error.message : String(error) },
        'Failed to write audit-log row for event registrations export',
      );
    }

    return new Response(toCsv(keys, rows, labels), {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${loaded.event.slug}-registrations-${todayStamp()}.csv"`,
        'cache-control': 'no-store',
      },
    });
  },
};

export const eventPagesEndpoints: Endpoint[] = [siteList, siteOne, banner, registrations, registrationsCsv];
