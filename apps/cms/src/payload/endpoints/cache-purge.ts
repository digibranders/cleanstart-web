import type { CollectionSlug, Endpoint } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import { isPurgeableCollection, purgePathsForDoc } from '../lib/web-pages';
import type { RevalidateRequest } from '../lib/web-revalidate';
import { revalidateWeb } from '../lib/web-revalidate';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

export const purgeBodySchema = z.discriminatedUnion('scope', [
  z.object({
    scope: z.literal('page'),
    collection: z.string().min(1),
    id: z.union([z.string().min(1), z.number()]),
  }),
  z.object({ scope: z.literal('all') }),
  z.object({
    scope: z.literal('custom'),
    paths: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
]);

export type PurgeBody = z.infer<typeof purgeBodySchema>;

export interface PurgePlan {
  status: number;
  error?: string;
  /** What to send to revalidateWeb. Page scope's detail path holds the $SLUG$ marker. */
  request?: RevalidateRequest;
  /** Page scope: the endpoint must load this doc and substitute the real slug. */
  needsDoc?: { collection: string; id: string | number };
}

/** Placeholder slug used by the pure resolver; the endpoint substitutes the real one. */
export const PAGE_SLUG_MARKER = '$SLUG$';

/** Pure access + path resolution. No DB, no network — fully unit-testable. */
export const resolvePurge = (user: unknown, body: PurgeBody): PurgePlan => {
  if (!user) return { status: 401, error: 'unauthorized' };

  if (body.scope === 'page') {
    if (!isPurgeableCollection(body.collection)) {
      return { status: 400, error: 'collection_not_purgeable' };
    }
    const paths = purgePathsForDoc(body.collection, { slug: PAGE_SLUG_MARKER });
    return {
      status: 200,
      request: { paths },
      needsDoc: { collection: body.collection, id: body.id },
    };
  }

  if (body.scope === 'all') {
    if (!hasRole(user, 'admin')) return { status: 403, error: 'forbidden' };
    return { status: 200, request: { layoutPaths: ['/'] } };
  }

  // custom
  if (!hasRole(user, 'admin')) return { status: 403, error: 'forbidden' };
  const paths = (body.paths ?? []).map((p) => p.trim()).filter((p) => p.length > 0);
  const tags = (body.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
  if (paths.length === 0 && tags.length === 0) {
    return { status: 400, error: 'nothing_to_purge' };
  }
  const bad = paths.find((p) => !p.startsWith('/'));
  if (bad) return { status: 400, error: `invalid_path:${bad}` };
  const request: RevalidateRequest = {};
  if (paths.length) request.paths = paths;
  if (tags.length) request.tags = tags;
  return { status: 200, request };
};

/**
 * POST /api/cache-purge — on-demand ISR cache invalidation from the admin.
 *
 * Config-level (single-segment) endpoint: not shadowed by Payload's REST
 * router (the 3-segment 404 gotcha does not apply). Cookie-authed; role-gated
 * in resolvePurge (page = editor+, all/custom = admin). The revalidate secret
 * stays server-side — the browser only calls this same-origin endpoint.
 */
export const cachePurgeEndpoint: Endpoint = {
  path: '/cache-purge',
  method: 'post',
  handler: async (req) => {
    let raw: unknown;
    try {
      raw = await req.json?.();
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = purgeBodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }

    const plan = resolvePurge(req.user, parsed.data);
    if (plan.status !== 200 || !plan.request) {
      return json({ ok: false, error: plan.error }, { status: plan.status });
    }

    let request = plan.request;
    if (plan.needsDoc) {
      let doc: { slug?: string | null };
      try {
        doc = (await req.payload.findByID({
          collection: plan.needsDoc.collection as CollectionSlug,
          id: plan.needsDoc.id,
          overrideAccess: true,
          depth: 0,
          draft: true,
        })) as { slug?: string | null };
      } catch {
        return json({ ok: false, error: 'not_found' }, { status: 404 });
      }
      request = { paths: purgePathsForDoc(plan.needsDoc.collection, doc) };
    }

    const result = await revalidateWeb(req.payload, request);

    return json({
      ok: result.ok || result.disabled,
      scope: parsed.data.scope,
      purged: request,
      disabled: result.disabled,
      webStatus: result.status,
    });
  },
};
