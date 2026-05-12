import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { normalizeWebflowGuide } from '../../../apps/cms/src/payload/lib/webflow-import/guides-normalize';

export const transformBlog = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const { faqs } = normalizeWebflowGuide(row);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? row.title ?? '',
    slug,
    abstract: row['post-summary'] ?? row.summary ?? null,
    body: row['post-body'] ?? row.body ?? null,
    publishedAt: row['date-published'] ?? row.publishedAt ?? null,
    faqs: faqs.length > 0 ? faqs : undefined,
    _rawAuthors: row['author-2'] ?? row.authors ?? null,
    _rawCategories: row.tags ?? row.categories ?? null,
    _rawHeroImage: row['thumbnail-image'] ?? row['main-image'] ?? row.image ?? null,
    featured: Boolean(row['featured-post'] ?? false),
  };
};
