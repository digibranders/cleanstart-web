import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { newsLinkToCanonicalPatch } from '../../../apps/cms/src/payload/lib/webflow-import/news-canonical';

export const transformNews = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const canonicalPatch = newsLinkToCanonicalPatch(row['news-link'] as string | undefined);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? '',
    slug,
    abstract: row['post-summary'] ?? row.summary ?? null,
    body: row['post-body'] ?? row.body ?? null,
    publicationDate: row['publication-date'] ?? row.publishedAt ?? null,
    _canonicalPatch: canonicalPatch ?? null,
    _rawNewsCategories: row['news-category'] ?? row.newsCategories ?? null,
    _rawHeroImage: row['thumbnail-image'] ?? row.image ?? null,
  };
};
