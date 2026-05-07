import { type ArticleSource, buildArticleBlob, inlineByline } from './article';
import { buildBreadcrumbBlob } from './breadcrumb';
import type { JsonLdContext } from './context';
import { buildFaqPageBlob } from './faq-page';
import { buildOrganizationBlob } from './organization';
import { buildPersonBlob, type AuthorSource } from './person';
import { onlyResolved, pickResolved, type ResolvedMedia } from './shared';
import type { JsonLdBlob } from './types';
import { docCanonicalUrl } from './url';
import { buildWebsiteBlob } from './website';

/** Collections this dispatcher can emit blobs for. */
export type EmittableCollection =
  | 'blogs'
  | 'news'
  | 'guides'
  | 'knowledgeBase'
  | 'authors';

const isEmittableCollection = (slug: string): slug is EmittableCollection =>
  slug === 'blogs' ||
  slug === 'news' ||
  slug === 'guides' ||
  slug === 'knowledgeBase' ||
  slug === 'authors';

interface AnyDoc extends Record<string, unknown> {
  slug?: string | null;
  title?: string | null;
  name?: string | null;
}

interface SeoBlock {
  title?: string | null;
  description?: string | null;
  speakablePath?: { selector?: string | null }[] | null;
}

interface CategoryLike {
  name?: string | null;
}

const readSeo = (doc: AnyDoc): SeoBlock =>
  ((doc as { seo?: SeoBlock }).seo ?? {}) as SeoBlock;

const readDescription = (doc: AnyDoc): string | null => {
  const abstract = (doc as { abstract?: string | null }).abstract;
  if (typeof abstract === 'string' && abstract.length > 0) return abstract;
  const seoDesc = readSeo(doc).description;
  return seoDesc && seoDesc.length > 0 ? seoDesc : null;
};

const readHeroImage = (doc: AnyDoc): ResolvedMedia | null => {
  const hero = (doc as { heroImage?: ResolvedMedia | number | null }).heroImage;
  if (!hero || typeof hero === 'number') return null;
  return hero;
};

const readPublishedAt = (doc: AnyDoc): string | null => {
  const explicit = (doc as { publishedAt?: string | null; publicationDate?: string | null });
  if (typeof explicit.publicationDate === 'string') return explicit.publicationDate;
  if (typeof explicit.publishedAt === 'string') return explicit.publishedAt;
  return null;
};

const readUpdatedAt = (doc: AnyDoc): string | null => {
  const ts = (doc as { updatedAt?: string }).updatedAt;
  return typeof ts === 'string' ? ts : null;
};

const readReviewedBy = (
  doc: AnyDoc,
): AuthorSource | number | null => {
  const value = (doc as { reviewedBy?: AuthorSource | number | null }).reviewedBy;
  return value ?? null;
};

const readDateReviewed = (doc: AnyDoc): string | null => {
  const ts = (doc as { lastReviewedAt?: string | null }).lastReviewedAt;
  return typeof ts === 'string' ? ts : null;
};

const readWordCount = (doc: AnyDoc): number | null => {
  const wc = (doc as { wordCount?: number | null }).wordCount;
  return typeof wc === 'number' ? wc : null;
};

const readFaqs = (doc: AnyDoc) =>
  ((doc as { faqs?: { question?: string | null; answer?: string | null }[] | null }).faqs ?? null);

const readKeywords = (doc: AnyDoc): string[] | null => {
  const list = (doc as { keywords?: { keyword?: string | null }[] | null }).keywords;
  if (!list) return null;
  const out = list
    .map((k) => k.keyword ?? '')
    .filter((s): s is string => s.length > 0);
  return out.length > 0 ? out : null;
};

const aboutFromCategoryList = (
  doc: AnyDoc,
  field: 'categories' | 'newsCategories',
): { name: string } | null => {
  const list = (doc as Record<string, unknown>)[field] as
    | readonly (Record<string, unknown> | number | null | undefined)[]
    | undefined;
  const first = pickResolved<Record<string, unknown>>(list);
  const name = (first as CategoryLike | null)?.name;
  if (!name) return null;
  return { name };
};

const aboutFromSingleCategory = (doc: AnyDoc): { name: string } | null => {
  const cat = (doc as { category?: CategoryLike | number | null }).category;
  if (!cat || typeof cat === 'number') return null;
  if (!cat.name) return null;
  return { name: cat.name };
};

/**
 * Compose Article-variant blobs alongside their dependencies
 * (Organization, WebSite, byline Persons, optional FAQPage,
 * optional Breadcrumb).
 */
const composeArticleBlobs = (
  ctx: JsonLdContext,
  source: ArticleSource,
  authors: readonly (AuthorSource | number | null | undefined)[] | null | undefined,
  breadcrumb: ReturnType<typeof buildBreadcrumbBlob>,
  faqs: ReturnType<typeof buildFaqPageBlob>,
): JsonLdBlob[] => {
  const blobs: JsonLdBlob[] = [
    buildOrganizationBlob(ctx),
    buildWebsiteBlob(ctx),
  ];

  const article = buildArticleBlob(ctx, source);
  if (article) blobs.push(article);

  for (const author of onlyResolved(
    authors as readonly (Record<string, unknown> | number | null | undefined)[] | null,
  ) as AuthorSource[]) {
    const blob = inlineByline(ctx, author);
    if (blob) blobs.push(blob);
  }

  if (breadcrumb) blobs.push(breadcrumb);
  if (faqs) blobs.push(faqs);
  return blobs;
};

const dispatchArticleLike = (
  ctx: JsonLdContext,
  collection: 'blogs' | 'news' | 'guides' | 'knowledgeBase',
  doc: AnyDoc,
): JsonLdBlob[] => {
  const slug = doc.slug ?? '';
  if (!doc.title || !slug) return [];
  const url = docCanonicalUrl(ctx.site.baseUrl, collection, doc as { slug: string });
  if (!url) return [];

  const variant: ArticleSource['variant'] =
    collection === 'news' ? 'NewsArticle' : collection === 'blogs' ? 'Article' : 'TechArticle';

  const about =
    collection === 'blogs'
      ? aboutFromCategoryList(doc, 'categories')
      : collection === 'news'
        ? aboutFromCategoryList(doc, 'newsCategories')
        : collection === 'knowledgeBase'
          ? aboutFromSingleCategory(doc)
          : null;

  const seo = readSeo(doc);
  const authors = (doc as { authors?: readonly (AuthorSource | number | null)[] | null })
    .authors;
  const faqsRaw = readFaqs(doc);

  const source: ArticleSource = {
    variant,
    url,
    title: doc.title,
    description: readDescription(doc),
    heroImage: readHeroImage(doc),
    authors: authors ?? null,
    reviewedBy: readReviewedBy(doc),
    datePublished: readPublishedAt(doc),
    dateModified: readUpdatedAt(doc),
    dateReviewed: readDateReviewed(doc),
    about,
    wordCount: readWordCount(doc),
    keywords: collection === 'guides' ? readKeywords(doc) : null,
    speakablePath: seo.speakablePath ?? null,
    seoTitle: seo.title ?? null,
  };

  const breadcrumbs = breadcrumbsFor(collection, doc);
  const breadcrumb = buildBreadcrumbBlob(ctx, breadcrumbs);
  const faqs = buildFaqPageBlob(url, faqsRaw);

  return composeArticleBlobs(ctx, source, authors, breadcrumb, faqs);
};

const breadcrumbsFor = (
  collection: 'blogs' | 'news' | 'guides' | 'knowledgeBase',
  doc: AnyDoc,
) => {
  const title = doc.title ?? '';
  switch (collection) {
    case 'blogs':
      return [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blogs' },
        { name: title, path: `/blogs/${doc.slug}` },
      ];
    case 'news':
      return [
        { name: 'Home', path: '/' },
        { name: 'News', path: '/news' },
        { name: title, path: `/news/${doc.slug}` },
      ];
    case 'guides':
      return [
        { name: 'Home', path: '/' },
        { name: 'Guides', path: '/guide' },
        { name: title, path: `/guide/${doc.slug}` },
      ];
    case 'knowledgeBase':
      return [
        { name: 'Home', path: '/' },
        { name: 'Knowledge Hub', path: '/knowledge-hub' },
        { name: title, path: `/knowledge-hub/${doc.slug}` },
      ];
  }
};

const dispatchAuthor = (ctx: JsonLdContext, doc: AnyDoc): JsonLdBlob[] => {
  const slug = doc.slug ?? '';
  const name = doc.name ?? '';
  if (!slug || !name) return [];

  const blobs: JsonLdBlob[] = [
    buildOrganizationBlob(ctx),
    buildWebsiteBlob(ctx),
  ];

  const person = buildPersonBlob(ctx, doc as AuthorSource);
  if (person) blobs.push(person);

  const breadcrumb = buildBreadcrumbBlob(ctx, [
    { name: 'Home', path: '/' },
    { name: 'Authors', path: '/authors' },
    { name, path: `/author/${slug}` },
  ]);
  if (breadcrumb) blobs.push(breadcrumb);

  return blobs;
};

/**
 * Dispatch entry point. Takes a Payload-resolved document plus its
 * collection slug, returns the ordered array of JSON-LD blobs the
 * public renderer should emit. Returns an empty array when the
 * collection is not in the Layer-1 catalog or required fields are
 * missing.
 */
export const buildJsonLdBlobs = (
  ctx: JsonLdContext,
  collection: string,
  doc: Record<string, unknown>,
): JsonLdBlob[] => {
  if (!isEmittableCollection(collection)) return [];
  const typed = doc as AnyDoc;
  if (collection === 'authors') return dispatchAuthor(ctx, typed);
  return dispatchArticleLike(ctx, collection, typed);
};
