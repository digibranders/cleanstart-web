import type { Endpoint, PayloadRequest } from 'payload';

/**
 * GET /api/pageRegistry/live-schema?path=/some-page
 *
 * Returns the JSON-LD a page CURRENTLY emits, by fetching the rendered page
 * from apps/web and extracting its <script type="application/ld+json"> graph.
 *
 * This is the only accurate way to "view the current schema" of a page in the
 * CMS: after the Phase-0 unification, a page's auto schema (breadcrumb, FAQ,
 * SoftwareApplication, …) is composed in apps/web at build time — the CMS does
 * not recompute it. So we read what the live page actually ships.
 *
 * Auth: admin-only surface (logged-in user). Read-only; no writes.
 */

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const SCRIPT_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export interface LiveSchemaBlock {
  type: string;
  /** The node, pretty-printed for display. */
  json: string;
}

const typeOf = (node: unknown): string => {
  if (node != null && typeof node === 'object') {
    const t = (node as { '@type'?: unknown })['@type'];
    if (typeof t === 'string') return t;
    if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
  }
  return 'Unknown';
};

/** Top-level @type(s) present in an override value (single blob or array). */
const overrideTypesOf = (value: unknown): string[] => {
  const blobs = Array.isArray(value) ? value : value != null ? [value] : [];
  const out: string[] = [];
  for (const blob of blobs) {
    const t = typeOf(blob);
    if (t !== 'Unknown') out.push(t);
  }
  return out;
};

/** Flatten extracted JSON-LD scripts into individual @graph nodes. Exported for tests. */
export const extractSchemaBlocks = (html: string): LiveSchemaBlock[] => {
  const blocks: LiveSchemaBlock[] = [];
  for (const match of html.matchAll(SCRIPT_RE)) {
    const raw = (match[1] ?? '').trim();
    if (raw.length === 0) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const nodes =
      parsed != null && typeof parsed === 'object' && Array.isArray((parsed as { '@graph'?: unknown })['@graph'])
        ? ((parsed as { '@graph': unknown[] })['@graph'])
        : [parsed];
    for (const node of nodes) {
      blocks.push({ type: typeOf(node), json: JSON.stringify(node, null, 2) });
    }
  }
  return blocks;
};

const handler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user) return json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const url = new URL(req.url ?? '', 'http://internal');
  const path = url.searchParams.get('path') ?? '';
  if (!path.startsWith('/') || path.includes('://')) {
    return json({ ok: false, error: 'A site-relative ?path=/… is required.' }, { status: 400 });
  }

  const base = (process.env.WEB_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  const target = `${base}${path}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!res.ok) {
      return json({ ok: false, error: `Live page returned ${res.status}.`, source: target });
    }
    const html = await res.text();
    const blocks = extractSchemaBlocks(html);

    // Provenance + override timestamp from the registry row, so each block can
    // be labelled auto vs override and show WHEN the override was last edited.
    let overrideTypes: string[] = [];
    let overrideUpdatedAt: string | null = null;
    try {
      const found = await req.payload.find({
        collection: 'pageRegistry',
        where: { path: { equals: path } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const row = found.docs[0] as { additionalSchema?: unknown; updatedAt?: string } | undefined;
      if (row?.additionalSchema != null) {
        overrideTypes = overrideTypesOf(row.additionalSchema);
        overrideUpdatedAt = row.updatedAt ?? null;
      }
    } catch {
      // provenance is best-effort; the live blocks are the important part
    }

    const labelled = blocks.map((b) => ({
      ...b,
      provenance: overrideTypes.includes(b.type) ? ('override' as const) : ('auto' as const),
    }));

    return json({
      ok: true,
      blocks: labelled,
      overrideUpdatedAt,
      source: target,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'fetch failed';
    return json({ ok: false, error: `Could not reach the live page (${reason}).`, source: target });
  }
};

export const pageLiveSchemaEndpoint: Endpoint = {
  path: '/live-schema',
  method: 'get',
  handler,
};
