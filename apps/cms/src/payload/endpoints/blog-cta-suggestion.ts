import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const WEB_TIMEOUT_MS = 8_000;

/** What apps/web answers: the pick the page makes by itself, with no editor overrides. */
const webAnswerSchema = z.object({
  ok: z.literal(true),
  resource: z
    .object({ title: z.string(), typeLabel: z.string(), slug: z.string() })
    .nullable(),
  image: z.object({ name: z.string() }).nullable(),
});

export type WebAnswer = z.infer<typeof webAnswerSchema>;

/** The collections whose pages have the sidebar CTAs. */
const collectionSchema = z.enum(['blogs', 'advisories']);
export type SuggestionCollection = z.infer<typeof collectionSchema>;

export type BlogCtaSuggestionResult =
  | { status: 200; body: { ok: true; available: true; resource: WebAnswer['resource']; image: WebAnswer['image'] } }
  | { status: 200; body: { ok: true; available: false; reason: 'web_not_configured' | 'web_unavailable' } }
  | { status: 400 | 401 | 403 | 404; body: { ok: false; error: string } };

export interface SuggestionDeps {
  env: Readonly<Record<string, string | undefined>>;
  fetchImpl: typeof fetch;
  /** The document's slug, draft included. Null when there is no such document. */
  loadSlug: (id: number, collection: SuggestionCollection) => Promise<string | null>;
}

/** URL of the apps/web suggestion route, built from the same env the revalidate hooks use. */
export const webSuggestionUrl = (
  env: SuggestionDeps['env'],
  slug: string,
  collection: SuggestionCollection = 'blogs',
): string | null => {
  const base = env.WEB_REVALIDATE_URL;
  if (!base || !env.WEB_REVALIDATE_SECRET) return null;
  try {
    const url = new URL('/api/blog-cta-suggestion', base);
    url.searchParams.set('slug', slug);
    if (collection !== 'blogs') url.searchParams.set('collection', collection);
    return url.toString();
  } catch {
    return null;
  }
};

/**
 * The automatic sidebar pick for one blog post or advisory, asked of apps/web (which owns
 * the matching). Editors only. A web outage or missing config is a soft
 * "not available", never an error: it must not get in the way of editing.
 */
export const resolveSuggestion = async (
  user: unknown,
  rawId: string | null,
  deps: SuggestionDeps,
  rawCollection: string | null = null,
): Promise<BlogCtaSuggestionResult> => {
  if (!user) return { status: 401, body: { ok: false, error: 'unauthorized' } };
  if (!hasAnyRole(user, ['admin', 'editor'])) {
    return { status: 403, body: { ok: false, error: 'forbidden' } };
  }

  const id = z.coerce.number().int().positive().safeParse(rawId);
  if (!id.success) return { status: 400, body: { ok: false, error: 'invalid_id' } };

  const collection = collectionSchema.safeParse(rawCollection ?? 'blogs');
  if (!collection.success) return { status: 400, body: { ok: false, error: 'invalid_collection' } };

  const slug = await deps.loadSlug(id.data, collection.data);
  if (!slug) return { status: 404, body: { ok: false, error: 'not_found' } };

  const url = webSuggestionUrl(deps.env, slug, collection.data);
  if (!url) return { status: 200, body: { ok: true, available: false, reason: 'web_not_configured' } };

  try {
    const res = await deps.fetchImpl(url, {
      headers: { authorization: `Bearer ${deps.env.WEB_REVALIDATE_SECRET ?? ''}` },
      signal: AbortSignal.timeout(WEB_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) return { status: 200, body: { ok: true, available: false, reason: 'web_unavailable' } };
    const answer = webAnswerSchema.safeParse(await res.json());
    if (!answer.success) return { status: 200, body: { ok: true, available: false, reason: 'web_unavailable' } };
    return {
      status: 200,
      body: { ok: true, available: true, resource: answer.data.resource, image: answer.data.image },
    };
  } catch {
    return { status: 200, body: { ok: true, available: false, reason: 'web_unavailable' } };
  }
};

/**
 * GET /api/blog-cta-suggestion?id=<doc id>[&collection=advisories] — the automatic sidebar pick,
 * shown under the Cta Resource and Cta Image fields. Config-level
 * (single-segment) endpoint, cookie-authed; the web secret stays server-side.
 */
export const blogCtaSuggestionEndpoint: Endpoint = {
  path: '/blog-cta-suggestion',
  method: 'get',
  handler: async (req) => {
    const rawId =
      req.searchParams?.get?.('id') ?? new URL(req.url ?? '', 'http://internal').searchParams.get('id');

    const rawCollection =
      req.searchParams?.get?.('collection') ??
      new URL(req.url ?? '', 'http://internal').searchParams.get('collection');

    const result = await resolveSuggestion(req.user, rawId, {
      env: process.env,
      fetchImpl: fetch,
      loadSlug: async (id, collection) => {
        try {
          const doc = (await req.payload.findByID({
            collection,
            id,
            depth: 0,
            draft: true,
            overrideAccess: true,
            select: { slug: true },
          })) as { slug?: string | null };
          return doc.slug ?? null;
        } catch {
          return null;
        }
      },
    }, rawCollection);
    return json(result.body, { status: result.status });
  },
};
