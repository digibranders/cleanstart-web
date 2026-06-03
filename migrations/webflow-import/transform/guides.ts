import { webflowStatus } from './status';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';
import { normalizeWebflowGuide } from '../../../apps/cms/src/payload/lib/webflow-import/guides-normalize';

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

export const transformGuide = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);
  const bodyHtml = asHtmlString(row['main-text']) ?? asHtmlString(row.body);
  const abstract = asString(row['meta-description']) ?? asString(row.summary);
  const wordCount = asNumber(row['word-count']);
  const { faqs, keywords, citations, articleSections } = normalizeWebflowGuide(row);

  return {
    _webflowId: row.webflowId,
    _status: webflowStatus(row),
    title,
    slug,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    abstract,
    wordCount: wordCount ?? undefined,
    faqs: faqs.length > 0 ? faqs : undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    citations: citations.length > 0 ? citations : undefined,
    articleSections:
      articleSections.length > 0
        ? articleSections.map((s) => ({ heading: s.heading, body: htmlToLexical(s.body) }))
        : undefined,
    seo: buildSeoOverrides(row),
    _rawAuthors: row.author ?? row.authors ?? null,
    _rawReviewedBy: row['review-by'] ?? row['review-by-2'] ?? null,
    _rawHeroImage: row['main-image'] ?? row.image ?? null,
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
