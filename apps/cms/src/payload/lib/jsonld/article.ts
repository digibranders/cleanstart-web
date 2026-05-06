import type { JsonLdContext } from './context';
import { type AuthorSource, buildPersonBlob, personRefId } from './person';
import {
  buildSpeakable,
  imageObjectFromMedia,
  onlyResolved,
  type ResolvedMedia,
} from './shared';
import type { JsonLdBlob } from './types';

/**
 * Schema.org Article variants we emit. The variant is a per-collection
 * lock — Article for blogs, NewsArticle for news, TechArticle for
 * guides + knowledgeBase. NewsArticle must always carry
 * isAccessibleForFree per Google News 2026 free-content signal.
 */
export type ArticleVariant = 'Article' | 'NewsArticle' | 'TechArticle';

export interface ArticleAboutEntry {
  readonly name: string;
  readonly sameAs?: string;
}

export interface ArticleSource {
  readonly variant: ArticleVariant;
  /** Canonical absolute URL — used for both `@id` and `url`. */
  readonly url: string;
  readonly title: string;
  readonly description?: string | null;
  readonly heroImage?: ResolvedMedia | null;
  readonly authors?: readonly (AuthorSource | number | null | undefined)[] | null;
  readonly reviewedBy?: AuthorSource | number | null;
  readonly datePublished?: string | null;
  readonly dateModified?: string | null;
  readonly dateReviewed?: string | null;
  readonly about?: ArticleAboutEntry | null;
  readonly wordCount?: number | null;
  readonly keywords?: readonly string[] | null;
  readonly faqHasContent?: boolean;
  readonly speakablePath?: readonly { selector?: string | null }[] | null;
  /** Only set per-doc when the editor has overridden seo.title. */
  readonly seoTitle?: string | null;
}

const isResolvedAuthor = (
  author: AuthorSource | number | null | undefined,
): author is AuthorSource => author != null && typeof author !== 'number';

const buildAuthorReferences = (
  ctx: JsonLdContext,
  authors: readonly (AuthorSource | number | null | undefined)[] | null | undefined,
): unknown[] => {
  const resolved = onlyResolved(
    authors as readonly (Record<string, unknown> | number | null | undefined)[] | null,
  ) as AuthorSource[];
  const out: unknown[] = [];
  for (const author of resolved) {
    if (!author.slug || !author.name) continue;
    const id = personRefId(ctx, author);
    if (!id) continue;
    out.push({
      '@type': 'Person',
      '@id': id,
      name: author.name,
    });
  }
  return out;
};

/**
 * Build the Article-variant blob for a given source. Returns null
 * when the bare-minimum required fields (title, url) are missing.
 */
export const buildArticleBlob = (
  ctx: JsonLdContext,
  source: ArticleSource,
): JsonLdBlob | null => {
  if (!source.title || !source.url) return null;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': source.variant,
    '@id': source.url,
    url: source.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': source.url },
    headline: source.seoTitle && source.seoTitle.length > 0 ? source.seoTitle : source.title,
    inLanguage: ctx.site.defaultLocale,
    publisher: { '@id': ctx.organizationId },
    isAccessibleForFree: true,
  };

  if (source.description) {
    blob.description = source.description;
  }

  const image = imageObjectFromMedia(source.heroImage);
  if (image) blob.image = image;

  if (source.datePublished) blob.datePublished = source.datePublished;
  if (source.dateModified) blob.dateModified = source.dateModified;

  const authors = buildAuthorReferences(ctx, source.authors);
  if (authors.length > 0) blob.author = authors;

  if (isResolvedAuthor(source.reviewedBy)) {
    const id = personRefId(ctx, source.reviewedBy);
    if (id && source.reviewedBy.name) {
      const reviewer: Record<string, unknown> = {
        '@type': 'Person',
        '@id': id,
        name: source.reviewedBy.name,
      };
      if (source.reviewedBy.role) reviewer.jobTitle = source.reviewedBy.role;
      blob.reviewedBy = reviewer;
      const reviewed = source.dateReviewed ?? source.dateModified;
      if (reviewed) blob.dateReviewed = reviewed;
    }
  }

  if (source.about) {
    const about: Record<string, unknown> = {
      '@type': 'Thing',
      name: source.about.name,
    };
    if (source.about.sameAs) about.sameAs = source.about.sameAs;
    blob.about = about;
  }

  if (typeof source.wordCount === 'number' && source.wordCount > 0) {
    blob.wordCount = source.wordCount;
  }

  if (source.keywords && source.keywords.length > 0) {
    blob.mentions = source.keywords.map((name) => ({ '@type': 'Thing', name }));
  }

  blob.speakable = buildSpeakable(source.speakablePath);

  return blob as JsonLdBlob;
};

/**
 * Promote a single resolved author into a Person blob. Used by
 * dispatchers to inline byline Person blobs alongside the Article
 * blob (so each author is fully described once, then referenced by
 * `@id` from the Article).
 */
export const inlineByline = (
  ctx: JsonLdContext,
  author: AuthorSource | number | null | undefined,
): JsonLdBlob | null => {
  if (!isResolvedAuthor(author)) return null;
  return buildPersonBlob(ctx, author);
};
