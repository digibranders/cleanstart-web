import { webflowStatus } from './status';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';
import { newsLinkToCanonicalPatch } from '../../../apps/cms/src/payload/lib/webflow-import/news-canonical';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

const asHtmlString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

export const transformNews = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);
  const abstract = asString(row['abstract-2']) ?? asString(row['post-summary']);
  const bodyHtml = asHtmlString(row['main-text']) ?? asHtmlString(row['post-body']);
  const publicationDate =
    asString(row['publication-date']) ?? asString(row['date-of-publication']) ?? null;
  const externalUrl = asString(row['news-link-2']) ?? asString(row['news-link']);
  const canonicalPatch = newsLinkToCanonicalPatch(externalUrl ?? undefined);

  return {
    _webflowId: row.webflowId,
    _status: webflowStatus(row),
    title,
    slug,
    abstract,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    publicationDate,
    externalUrl,
    seo: buildSeoOverrides(row),
    _canonicalPatch: canonicalPatch ?? null,
    _rawAuthors: row.author ?? row.authors ?? null,
    _rawNewsCategories: row['categories-2'] ?? row['news-category'] ?? row.categories ?? null,
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
