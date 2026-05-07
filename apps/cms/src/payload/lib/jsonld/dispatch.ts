import { dispatchAddons, mergeAddons } from './addons/dispatch';
import { type ArticleSource, buildArticleBlob, inlineByline } from './article';
import { buildBreadcrumbBlob } from './breadcrumb';
import type { JsonLdContext } from './context';
import { buildEventBlob, type EventAttendanceMode } from './event';
import { buildFaqPageBlob } from './faq-page';
import { validateOverride } from './override-validator';
import {
  buildJobPostingBlob,
  type JobLocationSource,
  type JobSalaryRange,
} from './job-posting';
import { buildOrganizationBlob } from './organization';
import { buildPersonBlob, type AuthorSource } from './person';
import { onlyResolved, pickResolved, type ResolvedMedia } from './shared';
import type { JsonLdBlob } from './types';
import { docCanonicalUrl } from './url';
import { buildWebPageBlob, webPageVariantForPath } from './web-page';
import { buildWebsiteBlob } from './website';
import { extractFromLexical } from '../lexical-extract';

/** Collections this dispatcher can emit blobs for. */
export type EmittableCollection =
  | 'blogs'
  | 'news'
  | 'guides'
  | 'knowledgeBase'
  | 'authors'
  | 'events'
  | 'webinars'
  | 'jobs'
  | 'pages'
  | 'resources';

const isEmittableCollection = (slug: string): slug is EmittableCollection =>
  slug === 'blogs' ||
  slug === 'news' ||
  slug === 'guides' ||
  slug === 'knowledgeBase' ||
  slug === 'authors' ||
  slug === 'events' ||
  slug === 'webinars' ||
  slug === 'jobs' ||
  slug === 'pages' ||
  slug === 'resources';

interface AnyDoc extends Record<string, unknown> {
  slug?: string | null;
  title?: string | null;
  name?: string | null;
}

interface SeoBlock {
  title?: string | null;
  description?: string | null;
  speakablePath?: { selector?: string | null }[] | null;
  additionalSchema?: unknown;
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

/**
 * Resolve `datePublished` for the JSON-LD Article variant.
 *
 * Precedence:
 *   1. `publicationDate` — News uses this (editor-set, signals story
 *      time rather than first-publish time).
 *   2. `publishedAt` — auto-set by `firstPublishHook` on the first
 *      draft → published transition. Editor-overridable for backdating.
 *   3. `createdAt` — defensive fallback so legacy rows that predate
 *      the `publishedAt` field still emit a non-null `datePublished`
 *      and pass schema.org Article validation. Approximate: `createdAt`
 *      is row-creation time, which is at-or-before first publish — so
 *      schemes never claim a publish date that's after the actual one.
 */
const readPublishedAt = (doc: AnyDoc): string | null => {
  const explicit = (doc as {
    publishedAt?: string | null;
    publicationDate?: string | null;
    createdAt?: string | null;
  });
  if (typeof explicit.publicationDate === 'string') return explicit.publicationDate;
  if (typeof explicit.publishedAt === 'string') return explicit.publishedAt;
  if (typeof explicit.createdAt === 'string') return explicit.createdAt;
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

const readSpeakers = (
  doc: AnyDoc,
): readonly (AuthorSource | number | null | undefined)[] | null => {
  const list = (doc as { speakers?: readonly (AuthorSource | number | null)[] | null })
    .speakers;
  return list ?? null;
};

const dispatchEvent = (
  ctx: JsonLdContext,
  collection: 'events' | 'webinars',
  doc: AnyDoc,
): JsonLdBlob[] => {
  if (!doc.title || !doc.slug) return [];
  const url = docCanonicalUrl(ctx.site.baseUrl, collection, doc as { slug: string });
  if (!url) return [];

  const seo = readSeo(doc);
  // Webinars are conceptually online; Events default to offline.
  // (Future: a per-doc `attendanceMode` field would let editors mark
  // events as Mixed.)
  const attendanceMode: EventAttendanceMode = collection === 'webinars' ? 'Online' : 'Offline';

  const blobs: JsonLdBlob[] = [
    buildOrganizationBlob(ctx),
    buildWebsiteBlob(ctx),
  ];

  const event = buildEventBlob(ctx, {
    url,
    title: doc.title,
    description: readDescription(doc),
    heroImage: readHeroImage(doc),
    startsAt: (doc as { startsAt?: string | null }).startsAt ?? null,
    endsAt: (doc as { endsAt?: string | null }).endsAt ?? null,
    attendanceMode,
    venue: (doc as { venue?: string | null }).venue ?? null,
    virtualUrl:
      (doc as { recordingUrl?: string | null }).recordingUrl ??
      (doc as { registrationUrl?: string | null }).registrationUrl ??
      null,
    speakers: readSpeakers(doc),
    registrationUrl: (doc as { registrationUrl?: string | null }).registrationUrl ?? null,
    capacity: (doc as { attendeesCap?: number | null }).attendeesCap ?? null,
  });
  if (event) blobs.push(event);

  // Inline speaker Person blobs so each `performer` reference resolves.
  for (const speaker of onlyResolved(
    readSpeakers(doc) as readonly (Record<string, unknown> | number | null | undefined)[] | null,
  ) as AuthorSource[]) {
    const blob = buildPersonBlob(ctx, speaker);
    if (blob) blobs.push(blob);
  }

  const breadcrumb = buildBreadcrumbBlob(
    ctx,
    collection === 'events'
      ? [
          { name: 'Home', path: '/' },
          { name: 'Events', path: '/event' },
          { name: doc.title, path: `/event/${doc.slug}` },
        ]
      : [
          { name: 'Home', path: '/' },
          { name: 'Webinars', path: '/webinar' },
          { name: doc.title, path: `/webinar/${doc.slug}` },
        ],
  );
  if (breadcrumb) blobs.push(breadcrumb);

  // Optional: speakable selectors propagate via the SEO group; not
  // currently consumed by Event but kept for parity if future schema
  // changes add it.
  void seo;

  return blobs;
};

const extractDescriptionForJob = (doc: AnyDoc): string => {
  // schema.org JobPosting REQUIRES `description`. Try richest source
  // first, then sensible fallbacks so we always have something to
  // emit (otherwise the JobPosting blob is dropped entirely).
  const abstract = (doc as { abstract?: string | null }).abstract;
  if (typeof abstract === 'string' && abstract.length > 0) return abstract;

  const seoDesc = readSeo(doc).description;
  if (typeof seoDesc === 'string' && seoDesc.length > 0) return seoDesc;

  const body = (doc as { body?: unknown }).body;
  if (body && typeof body === 'object') {
    const summary = extractFromLexical(body);
    if (summary.wordCount > 0) {
      // We only need text — `extractFromLexical` doesn't return it
      // verbatim, so reduce one more time. Acceptable inefficiency
      // since this only runs on the JSON-LD endpoint, behind a 60s
      // cache.
      const text = collectLexicalText(body);
      if (text.length > 0) return text.slice(0, 5000);
    }
  }

  return doc.title ?? 'Job description';
};

interface LexicalNodeShape {
  text?: string;
  children?: LexicalNodeShape[];
}

const collectLexicalText = (body: unknown): string => {
  const root = (body as { root?: LexicalNodeShape } | null)?.root;
  if (!root) return '';
  const out: string[] = [];
  const walk = (node: LexicalNodeShape): void => {
    if (typeof node.text === 'string' && node.text.length > 0) {
      out.push(node.text);
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };
  walk(root);
  return out.join(' ').replace(/\s+/g, ' ').trim();
};

const dispatchJob = (ctx: JsonLdContext, doc: AnyDoc): JsonLdBlob[] => {
  if (!doc.title || !doc.slug) return [];
  const url = docCanonicalUrl(ctx.site.baseUrl, 'jobs', doc as { slug: string });
  if (!url) return [];

  const blobs: JsonLdBlob[] = [
    buildOrganizationBlob(ctx),
    buildWebsiteBlob(ctx),
  ];

  const datePosted =
    (doc as { publishedAt?: string | null }).publishedAt ??
    (doc as { createdAt?: string | null }).createdAt ??
    null;
  if (!datePosted) return blobs;

  const validThrough =
    (doc as { applicationDeadline?: string | null }).applicationDeadline ??
    (doc as { expiresAt?: string | null }).expiresAt ??
    null;

  const salaryRaw = (doc as { salaryRange?: JobSalaryRange | null }).salaryRange ?? null;

  const job = buildJobPostingBlob(ctx, {
    url,
    title: doc.title,
    description: extractDescriptionForJob(doc),
    datePosted,
    validThrough,
    employmentType: (doc as { employmentType?: string | null }).employmentType ?? null,
    remote: (doc as { remote?: boolean }).remote ?? false,
    locations:
      (doc as { locations?: readonly (JobLocationSource | number | null)[] | null })
        .locations ?? null,
    experienceLevel: (doc as { experienceLevel?: string | null }).experienceLevel ?? null,
    salary: salaryRaw,
    applyUrl:
      (doc as { applyUrl?: string | null }).applyUrl ??
      (doc as { atsUrl?: string | null }).atsUrl ??
      null,
    hiringStatus:
      (doc as { hiringStatus?: 'open' | 'paused' | 'closed' }).hiringStatus ?? 'open',
  });
  if (job) blobs.push(job);

  const breadcrumb = buildBreadcrumbBlob(ctx, [
    { name: 'Home', path: '/' },
    { name: 'Jobs', path: '/job' },
    { name: doc.title, path: `/job/${doc.slug}` },
  ]);
  if (breadcrumb) blobs.push(breadcrumb);

  return blobs;
};

const dispatchPage = (ctx: JsonLdContext, doc: AnyDoc): JsonLdBlob[] => {
  if (!doc.title) return [];
  const url = docCanonicalUrl(ctx.site.baseUrl, 'pages', doc as {
    slug?: string | null;
    path?: string | null;
  });
  if (!url) return [];

  const path = (doc as { path?: string | null }).path ?? null;
  const variant = webPageVariantForPath(path);

  const blobs: JsonLdBlob[] = [
    buildOrganizationBlob(ctx),
    buildWebsiteBlob(ctx),
  ];

  const page = buildWebPageBlob(ctx, {
    url,
    title: doc.title,
    description: readDescription(doc),
    heroImage: readHeroImage(doc),
    datePublished: readPublishedAt(doc),
    dateModified: readUpdatedAt(doc),
    variant,
  });
  if (page) blobs.push(page);

  // Pages live at arbitrary nested paths. We can't auto-emit a
  // breadcrumb without knowing the parent chain; the dispatcher
  // skips it for pages and relies on the public site to render the
  // breadcrumb structure if needed.

  return blobs;
};

const dispatchResource = (ctx: JsonLdContext, doc: AnyDoc): JsonLdBlob[] => {
  if (!doc.title || !doc.slug) return [];
  const url = docCanonicalUrl(ctx.site.baseUrl, 'resources', doc as { slug: string });
  if (!url) return [];

  const blobs: JsonLdBlob[] = [
    buildOrganizationBlob(ctx),
    buildWebsiteBlob(ctx),
  ];

  const page = buildWebPageBlob(ctx, {
    url,
    title: doc.title,
    description:
      (doc as { summary?: string | null }).summary ?? readDescription(doc),
    heroImage: readHeroImage(doc),
    datePublished: readPublishedAt(doc),
    dateModified: readUpdatedAt(doc),
    variant: 'WebPage',
  });
  if (page) blobs.push(page);

  const breadcrumb = buildBreadcrumbBlob(ctx, [
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: doc.title, path: `/resources/${doc.slug}` },
  ]);
  if (breadcrumb) blobs.push(breadcrumb);

  return blobs;
};

const buildLayerOneBlobs = (
  ctx: JsonLdContext,
  collection: string,
  doc: AnyDoc,
): JsonLdBlob[] => {
  if (collection === 'authors') return dispatchAuthor(ctx, doc);
  if (collection === 'events' || collection === 'webinars') {
    return dispatchEvent(ctx, collection, doc);
  }
  if (collection === 'jobs') return dispatchJob(ctx, doc);
  if (collection === 'pages') return dispatchPage(ctx, doc);
  if (collection === 'resources') return dispatchResource(ctx, doc);
  return dispatchArticleLike(
    ctx,
    collection as 'blogs' | 'news' | 'guides' | 'knowledgeBase',
    doc,
  );
};

/**
 * Dispatch entry point. Takes a Payload-resolved document plus its
 * collection slug, returns the ordered array of JSON-LD blobs the
 * public renderer should emit. Returns an empty array when the
 * collection is not in the Layer-1 catalog or required fields are
 * missing.
 *
 * Pipeline:
 *   1. Layer 1 — auto-emitted blobs (Article / Event / WebPage / etc.)
 *   2. Layer 2 — `schemaAddons[]` blocks merged in via the addons
 *      dispatcher (HowTo, VideoObject, Review, SoftwareApplication,
 *      manual FAQ entries, breadcrumb suppress/replace).
 *   3. (Future) Layer 3 — admin-only `additionalSchema` raw JSON
 *      override appended last so editors' opt-in additions can't be
 *      overwritten by structured Layer 2 blocks.
 */
export const buildJsonLdBlobs = (
  ctx: JsonLdContext,
  collection: string,
  doc: Record<string, unknown>,
): JsonLdBlob[] => {
  if (!isEmittableCollection(collection)) return [];
  const typed = doc as AnyDoc;

  const layerOne = buildLayerOneBlobs(ctx, collection, typed);
  if (layerOne.length === 0) return layerOne;

  const url = layerOne.find((b) => typeof b['@id'] === 'string')?.['@id'] as
    | string
    | undefined;
  const pageUrl = url ?? ctx.site.baseUrl;

  const addons = dispatchAddons(
    ctx,
    pageUrl,
    (typed as { schemaAddons?: unknown }).schemaAddons,
  );
  const layerOnePlusAddons = mergeAddons(pageUrl, layerOne, addons);

  // Tier 3 — admin-only `seo.additionalSchema` raw override. Re-
  // validates here as defence-in-depth: if a row predates an allow-
  // list contraction, we drop it from the public output rather than
  // silently emitting a no-longer-allowed @type. Console.warn surfaces
  // overrides in the canary log stream so we know which pages have
  // manual markup.
  const override = readSeo(typed).additionalSchema;
  if (override == null) return layerOnePlusAddons;

  const result = validateOverride(override);
  if (!result.ok) {
    // eslint-disable-next-line no-console -- canary visibility for ops
    console.warn(
      `[jsonld] Dropping seo.additionalSchema for ${collection}#${String(typed.id ?? '?')} — ${result.message}`,
    );
    return layerOnePlusAddons;
  }

  // eslint-disable-next-line no-console -- canary visibility for ops
  console.warn(
    `[jsonld] Emitting admin override for ${collection}#${String(typed.id ?? '?')}.`,
  );

  const overrideBlobs = (Array.isArray(override) ? override : [override]) as JsonLdBlob[];
  return [...layerOnePlusAddons, ...overrideBlobs];
};
