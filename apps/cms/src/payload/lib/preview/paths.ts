import { ROUTE_PREFIX } from '../route-prefixes';

/**
 * Public-site path for any draft-enabled collection doc. Mirrored on
 * the web side at `apps/web/src/lib/preview/paths.ts`; the two files
 * must stay in lockstep — adding a new collection requires updating
 * both. Returns `null` when the doc has no usable slug/path yet (the
 * preview UI surfaces "save once before previewing" in that case).
 *
 * Pages use their computed `path` field (nested URL); everything else
 * uses the per-collection prefix from `ROUTE_PREFIX`.
 */
/**
 * Collections that have a live public-site detail route and therefore
 * show the Preview / Live Preview controls in the admin edit view.
 * Taxonomy and form collections are deliberately excluded — they have no
 * routable public URL and Preview would 404 for editors.
 */
export const PREVIEWABLE_COLLECTIONS = [
  'blogs',
  'news',
  'pages',
  'jobs',
  'events',
  'webinars',
  'guides',
  'knowledgeBase',
  'podcastEpisodes',
  'resources',
] as const;

export type PreviewableCollection = (typeof PREVIEWABLE_COLLECTIONS)[number];

export const isPreviewableCollection = (slug: string): slug is PreviewableCollection =>
  (PREVIEWABLE_COLLECTIONS as readonly string[]).includes(slug);

interface PreviewDoc {
  slug?: string | null;
  path?: string | null;
  id?: string | number | null;
}

const PODCAST_PREFIX = '/podcast/episode';
const FORMS_PREFIX = '/forms';

export const previewPathForDoc = (collection: string, doc: PreviewDoc): string | null => {
  if (collection === 'pages') {
    if (typeof doc.path === 'string' && doc.path.length > 0) return doc.path;
    if (typeof doc.slug === 'string' && doc.slug.length > 0) return `/${doc.slug}`;
    return null;
  }
  if (collection === 'podcastEpisodes') {
    return typeof doc.slug === 'string' && doc.slug.length > 0
      ? `${PODCAST_PREFIX}/${doc.slug}`
      : null;
  }
  if (collection === 'forms') {
    return typeof doc.slug === 'string' && doc.slug.length > 0
      ? `${FORMS_PREFIX}/${doc.slug}`
      : null;
  }
  const prefix = (ROUTE_PREFIX as Record<string, string>)[collection];
  if (!prefix) return null;
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null;
  return `${prefix}/${doc.slug}`;
};

interface LivePreviewUrlArgs {
  webBaseUrl: string;
  livePreviewSecret: string;
  collection: string;
  doc: PreviewDoc;
}

/**
 * Build the URL that Payload loads inside its Live Preview iframe.
 * The web side validates `secret` against `LIVE_PREVIEW_SECRET`,
 * enables `draftMode()`, and redirects to `path`.
 */
export const buildLivePreviewUrl = ({
  webBaseUrl,
  livePreviewSecret,
  collection,
  doc,
}: LivePreviewUrlArgs): string | null => {
  const path = previewPathForDoc(collection, doc);
  if (!path) return null;
  const params = new URLSearchParams({
    secret: livePreviewSecret,
    collection,
    path,
  });
  if (doc.id != null) params.set('docId', String(doc.id));
  return `${webBaseUrl}/api/preview/enable?${params.toString()}`;
};
