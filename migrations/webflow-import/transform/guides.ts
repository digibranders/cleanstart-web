import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { normalizeWebflowGuide } from '../../../apps/cms/src/payload/lib/webflow-import/guides-normalize';

export const transformGuide = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const { faqs, keywords, citations } = normalizeWebflowGuide(row);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? '',
    slug,
    abstract: row.summary ?? row.description ?? null,
    body: row.body ?? row['post-body'] ?? null,
    publishedAt: row['date-published'] ?? row.publishedAt ?? null,
    faqs: faqs.length > 0 ? faqs : undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    citations: citations.length > 0 ? citations : undefined,
    _rawAuthors: row.authors ?? null,
    _rawCategories: row['guide-category'] ?? row.categories ?? null,
    _rawHeroImage: row.image ?? row.thumbnail ?? null,
  };
};
