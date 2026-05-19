import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

const asHtmlString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

const asNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const transformBlog = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);
  const abstract = asString(row['abstract-2']) ?? asString(row['post-summary']);
  const bodyHtml = asHtmlString(row['main-text']) ?? asHtmlString(row['post-body']);
  const publishedAt = asString(row['date-of-publication']) ?? asString(row['date-published']);
  const readingMinutes = asNumber(row['read-time-2']);

  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title,
    slug,
    abstract,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    publishedAt,
    readingMinutes: readingMinutes ?? undefined,
    featured: Boolean(row['featured-post']),
    seo: buildSeoOverrides(row),
    _rawAuthors: row.author ?? row['author-2'] ?? row.authors ?? null,
    _rawReviewedBy: row['review-by-2'] ?? row['review-by'] ?? null,
    _rawCategories: row.categories ?? row.tags ?? null,
    _rawHeroImage: row['main-image'] ?? row['thumbnail-image'] ?? row.image ?? null,
  };
};

const buildSeoOverrides = (row: Record<string, unknown>): Record<string, unknown> | undefined => {
  const title = asString(row['meta-title']);
  const description = asString(row['meta-description']);
  if (!title && !description) return undefined;
  const seo: Record<string, unknown> = {};
  if (title) seo.title = title;
  if (description) seo.description = description;
  return seo;
};
