import type { Endpoint } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { parseCatalogNames } from '../lib/catalog-images';

const CATALOG_SITEMAP = 'https://images.cleanstart.com/sitemap.xml';
const CACHE_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

export type CatalogImagesResult =
  | { status: 200; body: { ok: true; available: boolean; names: string[] } }
  | { status: 401 | 403; body: { ok: false; error: string } };

export interface CatalogImagesDeps {
  /** Null when the catalog could not be read. */
  loadNames: () => Promise<string[] | null>;
}

/**
 * The catalog image names for the advisory image picker. Editors only. An
 * unreachable catalog is a soft "not available", never an error: it must not
 * get in the way of editing.
 */
export const resolveCatalogImages = async (
  user: unknown,
  deps: CatalogImagesDeps,
): Promise<CatalogImagesResult> => {
  if (!user) return { status: 401, body: { ok: false, error: 'unauthorized' } };
  if (!hasAnyRole(user, ['admin', 'editor'])) {
    return { status: 403, body: { ok: false, error: 'forbidden' } };
  }
  const names = await deps.loadNames();
  return { status: 200, body: { ok: true, available: names !== null, names: names ?? [] } };
};

let cached: { at: number; names: string[] } | null = null;

const loadCatalogNames = async (): Promise<string[] | null> => {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.names;
  try {
    const res = await fetch(CATALOG_SITEMAP, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: 'no-store' });
    if (!res.ok) return cached?.names ?? null;
    const names = parseCatalogNames(await res.text());
    if (names.length === 0) return cached?.names ?? null;
    cached = { at: Date.now(), names };
    return names;
  } catch {
    return cached?.names ?? null;
  }
};

/** GET /api/catalog-images, config-level and cookie-authed like `blog-cta-suggestion`. */
export const catalogImagesEndpoint: Endpoint = {
  path: '/catalog-images',
  method: 'get',
  handler: async (req) => {
    const result = await resolveCatalogImages(req.user, { loadNames: loadCatalogNames });
    return json(result.body, { status: result.status });
  },
};
