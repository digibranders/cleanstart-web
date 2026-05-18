/**
 * Mirror of `apps/cms/src/payload/lib/preview/paths.ts`. The two
 * files must stay in lockstep — adding a previewable collection
 * means updating both, or `/api/preview/enable` will redirect to a
 * 404.
 *
 * The CMS side is authoritative for what gets minted; this side
 * only resolves the public path during draft mode bootstrap.
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
  'authors',
  'newsCategories',
  'knowledgeCategories',
  'categories',
  'forms',
] as const;

export type PreviewableCollection = (typeof PREVIEWABLE_COLLECTIONS)[number];

export const isPreviewableCollection = (slug: string): slug is PreviewableCollection =>
  (PREVIEWABLE_COLLECTIONS as readonly string[]).includes(slug);

const ROUTE_PREFIX: Record<PreviewableCollection, string | null> = {
  blogs: '/blog',
  news: '/news',
  pages: null, // pages use the doc-level `path` field
  jobs: '/job',
  events: '/events',
  webinars: '/webinar',
  guides: '/guide',
  knowledgeBase: '/knowledge-hub',
  podcastEpisodes: '/podcast/episode',
  resources: '/resource',
  authors: '/author',
  newsCategories: '/news-categories',
  knowledgeCategories: '/knowledge-hub/category',
  categories: '/category',
  forms: '/forms',
};

interface PreviewDoc {
  slug?: string | null;
  path?: string | null;
}

export const previewPathForDoc = (collection: string, doc: PreviewDoc): string | null => {
  if (collection === 'pages') {
    if (typeof doc.path === 'string' && doc.path.length > 0) return doc.path;
    if (typeof doc.slug === 'string' && doc.slug.length > 0) return `/${doc.slug}`;
    return null;
  }
  if (!isPreviewableCollection(collection)) return null;
  const prefix = ROUTE_PREFIX[collection];
  if (!prefix) return null;
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null;
  return `${prefix}/${doc.slug}`;
};
