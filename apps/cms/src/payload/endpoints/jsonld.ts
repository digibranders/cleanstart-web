import type { Endpoint } from 'payload';

import { buildJsonLdBlobs, buildJsonLdContext } from '../lib/jsonld';
import { hasRole } from '../access/typed-user';
import { validateOverrideForCollection } from '../lib/jsonld/override-validator';

const SUPPORTED_COLLECTIONS = new Set([
  'blogs',
  'news',
  'guides',
  'knowledgeBase',
  'authors',
  'events',
  'webinars',
  'jobs',
  'pages',
  'resources',
]);

const json = (
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): Response =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

/**
 * Pull `collection` and `id` from either the framework-provided
 * `routeParams` or, as a fallback, the URL itself. Keeps the handler
 * portable across Payload versions that route params slightly
 * differently.
 */
const readParams = (req: {
  url?: string | null;
  routeParams?: Record<string, string | string[]> | null | undefined;
}): { collection: string; id: string } | null => {
  const fromRoute = req.routeParams ?? null;
  if (fromRoute != null) {
    const c = fromRoute.collection;
    const i = fromRoute.id;
    const collection = Array.isArray(c) ? c[0] : c;
    const id = Array.isArray(i) ? i[0] : i;
    if (collection && id) return { collection, id };
  }
  if (req.url) {
    const parsed = new URL(req.url, 'http://internal');
    const segments = parsed.pathname.split('/').filter((s) => s.length > 0);
    // …/api/jsonld/<collection>/<id>
    const idx = segments.indexOf('jsonld');
    if (idx >= 0 && segments.length >= idx + 3) {
      const collection = segments[idx + 1];
      const id = segments[idx + 2];
      if (collection && id) return { collection, id };
    }
  }
  return null;
};

/**
 * GET /api/jsonld/<collection>/<id>
 *
 * Returns the ordered Layer-1 JSON-LD blob list for a single
 * published document. Used by the public renderer (or any external
 * consumer) to emit one `<script type="application/ld+json">` per
 * blob in document order.
 *
 * Public — read access matches each underlying collection's own
 * `read: () => true`. Drafts are excluded (only `_status: published`
 * is served) so unpublished work doesn't leak via this surface.
 *
 * Cache-control is `public, max-age=60` — short enough for editors
 * to see updates within a minute, long enough that crawlers and
 * the public site don't hammer Postgres.
 */
export const jsonLdEndpoint: Endpoint = {
  path: '/jsonld/:collection/:id',
  method: 'get',
  handler: async (req) => {
    const params = readParams(req as Parameters<typeof readParams>[0]);
    if (!params) {
      return json({ error: 'missing_collection_or_id' }, { status: 400 });
    }
    if (!SUPPORTED_COLLECTIONS.has(params.collection)) {
      return json(
        { error: 'unsupported_collection', collection: params.collection },
        { status: 400 },
      );
    }
    const numericId = Number.parseInt(params.id, 10);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return json({ error: 'invalid_id' }, { status: 400 });
    }

    const { payload } = req;

    const doc = await payload
      .findByID({
        collection: params.collection as Parameters<typeof payload.findByID>[0]['collection'],
        id: numericId,
        depth: 2,
        overrideAccess: false,
        draft: false,
      })
      .catch(() => null);
    if (!doc) {
      return json({ error: 'not_found' }, { status: 404 });
    }

    if ((doc as { _status?: string })._status === 'draft') {
      return json({ error: 'not_published' }, { status: 404 });
    }

    const [siteSettings, seoDefaults] = await Promise.all([
      payload.findGlobal({ slug: 'siteSettings' }),
      payload.findGlobal({ slug: 'seoDefaults' }),
    ]);

    const ctx = buildJsonLdContext({
      siteSettings: {
        siteName: (siteSettings as { siteName?: string }).siteName ?? 'CleanStart',
        baseUrl: (siteSettings as { baseUrl?: string }).baseUrl ?? 'https://cleanstart.com',
        defaultLocale: (siteSettings as { defaultLocale?: string }).defaultLocale ?? 'en-US',
      },
      seoDefaults: seoDefaults as Parameters<typeof buildJsonLdContext>[0]['seoDefaults'],
    });

    const blobs = buildJsonLdBlobs(
      ctx,
      params.collection,
      doc as unknown as Record<string, unknown>,
    );

    return json(
      { blobs },
      {
        headers: {
          'cache-control': 'public, max-age=60',
        },
      },
    );
  },
};

interface PreviewBody {
  additionalSchema?: unknown;
}

const readPreviewBody = async (
  req: { json?: () => Promise<unknown>; body?: unknown },
): Promise<PreviewBody> => {
  // Payload v3 passes the request through; depending on the runtime
  // it may expose `.json()` (web Request) or `.body` (already-parsed
  // JSON). Handle both — the lead-intake endpoint follows the same shape.
  if (typeof req.json === 'function') {
    try {
      const parsed = (await req.json()) as PreviewBody | null;
      return parsed ?? {};
    } catch {
      return {};
    }
  }
  if (req.body && typeof req.body === 'object') {
    return req.body as PreviewBody;
  }
  return {};
};

/**
 * POST /api/jsonld/<collection>/<id>
 *
 * Admin-only draft preview. Accepts `{ additionalSchema?: unknown }`
 * in the body, merges it onto the (possibly-draft) document, and
 * returns the same `{ blobs }` shape as GET — so the sidebar's
 * Schema card can render pasted JSON-LD before the editor saves.
 *
 * Auth: requires `roles` containing `admin`. The body's
 * `additionalSchema` is re-validated server-side via
 * `validateOverrideForCollection` — never trust the client.
 *
 * Drafts are included here (unlike GET) so editors can preview on
 * unpublished docs.
 */
export const jsonLdPreviewEndpoint: Endpoint = {
  path: '/jsonld/:collection/:id',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ error: 'forbidden' }, { status: 403 });
    }

    const params = readParams(req as Parameters<typeof readParams>[0]);
    if (!params) {
      return json({ error: 'missing_collection_or_id' }, { status: 400 });
    }
    if (!SUPPORTED_COLLECTIONS.has(params.collection)) {
      return json(
        { error: 'unsupported_collection', collection: params.collection },
        { status: 400 },
      );
    }
    const numericId = Number.parseInt(params.id, 10);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return json({ error: 'invalid_id' }, { status: 400 });
    }

    const body = await readPreviewBody(
      req as { json?: () => Promise<unknown>; body?: unknown },
    );

    const validation = validateOverrideForCollection(
      body.additionalSchema ?? null,
      params.collection,
    );
    if (!validation.ok) {
      return json(
        {
          error: 'invalid_override',
          message: validation.message,
          issues: validation.issues,
        },
        { status: 400 },
      );
    }

    const { payload } = req;
    const doc = await payload
      .findByID({
        collection: params.collection as Parameters<typeof payload.findByID>[0]['collection'],
        id: numericId,
        depth: 2,
        overrideAccess: false,
        draft: true,
      })
      .catch(() => null);
    if (!doc) {
      return json({ error: 'not_found' }, { status: 404 });
    }

    const [siteSettings, seoDefaults] = await Promise.all([
      payload.findGlobal({ slug: 'siteSettings' }),
      payload.findGlobal({ slug: 'seoDefaults' }),
    ]);

    const ctx = buildJsonLdContext({
      siteSettings: {
        siteName: (siteSettings as { siteName?: string }).siteName ?? 'CleanStart',
        baseUrl: (siteSettings as { baseUrl?: string }).baseUrl ?? 'https://cleanstart.com',
        defaultLocale: (siteSettings as { defaultLocale?: string }).defaultLocale ?? 'en-US',
      },
      seoDefaults: seoDefaults as Parameters<typeof buildJsonLdContext>[0]['seoDefaults'],
    });

    // Splice the pasted additionalSchema onto a shallow clone of the
    // doc so the dispatcher picks it up as if it were already saved.
    // The persisted value is untouched.
    const docRecord = doc as unknown as Record<string, unknown>;
    const docWithOverride: Record<string, unknown> = {
      ...docRecord,
      seo: {
        ...((docRecord.seo as Record<string, unknown> | undefined) ?? {}),
        additionalSchema: body.additionalSchema ?? null,
      },
    };

    const blobs = buildJsonLdBlobs(ctx, params.collection, docWithOverride);

    return json(
      { blobs, draft: (doc as { _status?: string })._status === 'draft' },
      { headers: { 'cache-control': 'no-store' } },
    );
  },
};
