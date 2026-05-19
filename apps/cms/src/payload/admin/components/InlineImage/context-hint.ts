import { slugify } from '../../../lib/slugify';

/**
 * Map collectionSlug → short prefix used in the inline-paste / inline-
 * insert context hint that drives Media filenames. Mirrors the
 * `web/<short>` folder enum in `Media.ts` so an image inserted into a
 * blog post ends up keyed as `blog-<post-slug>-inline-<hash>.webp`.
 */
const SHORT_COLLECTION: Record<string, string> = {
  blogs: 'blog',
  news: 'news',
  guides: 'guide',
  resources: 'resource',
  events: 'event',
  webinars: 'webinar',
  jobs: 'job',
  aboutGalleries: 'about',
  pages: 'page',
  authors: 'author',
  knowledgeBase: 'knowledge',
};

/**
 * Build the `x-media-context-hint` header value attached to inline
 * media uploads. The Media collection's `beforeValidate` falls back to
 * this hint when the upload's alt + filename are clipboard noise
 * (`image001.png`, `pasted-{ts}`, `ingested-{ts}` etc.), so editors
 * who paste straight from Word still get human-readable R2 keys.
 */
export const buildInlineMediaContextHint = (
  collectionSlug: string | null | undefined,
  title: string | null | undefined,
  docId: number | string | null | undefined,
): string => {
  const short = collectionSlug ? (SHORT_COLLECTION[collectionSlug] ?? 'doc') : 'doc';
  const titleSlug = title ? slugify(title) : '';
  const idStem = docId != null ? slugify(String(docId)) : '';
  const stem = titleSlug || idStem || 'untitled';
  return `${short}-${stem}-inline`;
};
