import type { Payload } from 'payload';

import { buildJsonLdBlobs, buildJsonLdContext, type JsonLdContext } from '../jsonld';
import { resolveSiteUrl } from '../site-url';

/**
 * Collections `buildJsonLdBlobs` actually supports — mirrors
 * `apps/cms/src/payload/endpoints/jsonld.ts`'s `SUPPORTED_COLLECTIONS`
 * exactly. The other 7 exportable collections (`case-studies`,
 * `podcastEpisodes`, `aboutGalleries`, `forms`, `deal-registrations`,
 * `career-applications`, `legalDocuments`) never emit JSON-LD, so the
 * Schema Types column is simply blank for their rows — not hidden, so
 * the picker stays consistent across all 17 exportable collections.
 */
const SCHEMA_EMITTABLE_COLLECTIONS = new Set([
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

export const isSchemaEmittableCollection = (slug: string): boolean =>
  SCHEMA_EMITTABLE_COLLECTIONS.has(slug);

/**
 * Fetches the two globals `buildJsonLdContext` needs and builds the
 * per-request context, mirroring `jsonld.ts`'s GET handler exactly
 * (same fallback defaults for `siteName`/`baseUrl`/`defaultLocale`).
 * Call once per export request — never per row — and only when
 * `__schemaTypes` is among the requested fields.
 */
export const buildExportJsonLdContext = async (payload: Payload): Promise<JsonLdContext> => {
  const [siteSettings, seoDefaults] = await Promise.all([
    payload.findGlobal({ slug: 'siteSettings' }),
    payload.findGlobal({ slug: 'seoDefaults' }),
  ]);

  return buildJsonLdContext({
    siteSettings: {
      siteName: (siteSettings as { siteName?: string }).siteName ?? 'CleanStart',
      baseUrl: resolveSiteUrl((siteSettings as { baseUrl?: string }).baseUrl),
      defaultLocale: (siteSettings as { defaultLocale?: string }).defaultLocale ?? 'en-US',
    },
    seoDefaults: seoDefaults as Parameters<typeof buildJsonLdContext>[0]['seoDefaults'],
  });
};

/**
 * Computes the "Schema Types" export cell: the distinct schema.org
 * `@type`s a document would produce, e.g. `"Article, HowTo"`. Blank
 * (not thrown) for a non-emittable collection or any error building
 * the blobs — a malformed/partially-populated doc must never fail the
 * whole export, just leave that one cell blank.
 */
export const computeSchemaTypesLabel = (
  ctx: JsonLdContext,
  slug: string,
  doc: Record<string, unknown>,
): string => {
  if (!isSchemaEmittableCollection(slug)) return '';
  try {
    const blobs = buildJsonLdBlobs(ctx, slug, doc);
    const types = new Set<string>();
    for (const blob of blobs) {
      const t = blob['@type'];
      if (typeof t === 'string') {
        types.add(t);
      } else if (Array.isArray(t)) {
        for (const single of t) {
          if (typeof single === 'string') types.add(single);
        }
      }
    }
    return Array.from(types).join(', ');
  } catch {
    return '';
  }
};
