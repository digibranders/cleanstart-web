import type { GraphNode } from "../types";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  /** Stable id so React doesn't dedupe two scripts with identical contents. */
  id?: string;
}

/**
 * Server-component wrapper that emits a JSON-LD <script> in the document head.
 * Use one <JsonLd> per schema; multiple per page is fine.
 *
 * IMPORTANT: never render user content here without escaping `</script>`.
 * `JSON.stringify` does not escape it — we replace it manually.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw script content; payload is JSON-stringified and < escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
      {...(id ? { id } : {})}
    />
  );
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Slug of the shared house byline in the `authors` collection. It is a team
 * account, not a person, so typing it as `Person` misdescribes the entity.
 */
const HOUSE_BYLINE_SLUG = "cleanstart-security";

/**
 * Map a byline to its Schema.org author node.
 *
 * Real contributors become `Person` with a link to their author page. The house
 * byline instead references the Organization by `@id` — that node already
 * carries name, url, logo and sameAs, so the reference is both truthful about
 * what wrote the piece and richer than a bare Person stub.
 *
 * If named experts later replace the house byline (they are the better E-E-A-T
 * signal), those authors flow through the Person branch automatically.
 */
const authorNode = (a: { name: string; slug?: string | undefined }) =>
  a.slug === HOUSE_BYLINE_SLUG
    ? { "@id": ORGANIZATION_ID }
    : {
        "@type": "Person",
        name: a.name,
        ...(a.slug ? { url: absoluteUrl(`/author/${a.slug}`) } : {}),
      };
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Shared schema.org event-status IRIs (Event + webinar ItemList). */
const EVENT_STATUS_IRI: Record<string, string> = {
  scheduled: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  cancelled: "https://schema.org/EventCancelled",
};

const DEFAULT_ORG_DESCRIPTION =
  "CleanStart provides hardened, near-zero-CVE container base images and a software supply-chain security platform, helping engineering and security teams ship trusted software faster.";

// Real, canonical brand profiles (mirror the footer social links) so search and
// generative engines can verify the CleanStart entity.
const DEFAULT_SAME_AS = [
  "https://www.linkedin.com/company/cleanstart-official",
  "https://x.com/CleanStartX",
  "https://github.com/cleanstart-dev",
  "https://www.youtube.com/@CleanStartOfficial",
  "https://hub.docker.com/u/cleanstart",
];

/** Editor-managed NewsMediaOrganization policy URLs (from seoDefaults). */
export interface NewsMediaConfig {
  foundingDate?: string;
  slogan?: string;
  masthead?: string;
  ethicsPolicy?: string;
  correctionsPolicy?: string;
  factCheckingPolicy?: string;
  actionableFeedbackPolicy?: string;
  unnamedSourcesPolicy?: string;
  diversityPolicy?: string;
  ownershipFundingInfo?: string;
  coveragePolicy?: string;
}

/**
 * CMS-managed Organization fields (from the `seoDefaults` global). Every field
 * is optional; missing values fall back to the hardcoded brand defaults, so the
 * build still produces valid markup if the CMS is unreachable (INV-1).
 */
export interface OrganizationFounder {
  name: string;
  jobTitle?: string;
  url?: string;
}

export interface OrganizationAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface OrganizationContactPoint {
  contactType: string;
  telephone?: string;
  email?: string;
  areaServed?: string;
}

export interface OrganizationIdentifiers {
  vatID?: string;
  taxID?: string;
  duns?: string;
  naics?: string;
  iso6523?: string;
}

export interface OrganizationConfig {
  name?: string;
  legalName?: string;
  alternateName?: string;
  url?: string;
  description?: string;
  logoUrl?: string;
  sameAs?: string[];
  slogan?: string;
  /** Company/website founding date — ISO 8601 (e.g. 2024-01-15). */
  foundingDate?: string;
  foundingLocation?: string;
  numberOfEmployees?: number;
  email?: string;
  telephone?: string;
  founders?: OrganizationFounder[];
  address?: OrganizationAddress;
  contactPoints?: OrganizationContactPoint[];
  identifiers?: OrganizationIdentifiers;
  /** When set, the node is emitted as a NewsMediaOrganization. */
  newsMedia?: NewsMediaConfig;
}

const hasAny = (o: object | undefined): boolean =>
  o != null && Object.values(o).some((v) => v != null && v !== "");

const founderNode = (f: OrganizationFounder): GraphNode => ({
  "@type": "Person",
  name: f.name,
  ...(f.jobTitle ? { jobTitle: f.jobTitle } : {}),
  ...(f.url ? { url: f.url } : {}),
});

const addressNode = (a: OrganizationAddress): GraphNode => ({
  "@type": "PostalAddress",
  ...(a.streetAddress ? { streetAddress: a.streetAddress } : {}),
  ...(a.addressLocality ? { addressLocality: a.addressLocality } : {}),
  ...(a.addressRegion ? { addressRegion: a.addressRegion } : {}),
  ...(a.postalCode ? { postalCode: a.postalCode } : {}),
  ...(a.addressCountry ? { addressCountry: a.addressCountry } : {}),
});

const contactPointNode = (c: OrganizationContactPoint): GraphNode => ({
  "@type": "ContactPoint",
  contactType: c.contactType,
  ...(c.telephone ? { telephone: c.telephone } : {}),
  ...(c.email ? { email: c.email } : {}),
  ...(c.areaServed ? { areaServed: c.areaServed } : {}),
});

export function organizationSchema(config: OrganizationConfig = {}) {
  const sameAs = config.sameAs && config.sameAs.length > 0 ? config.sameAs : DEFAULT_SAME_AS;
  const news = config.newsMedia;
  const founders = (config.founders ?? []).filter((f) => f.name?.trim());
  const contactPoints = (config.contactPoints ?? []).filter((c) => c.contactType?.trim());
  const id = config.identifiers;
  return {
    "@context": "https://schema.org",
    "@type": news ? "NewsMediaOrganization" : "Organization",
    "@id": ORGANIZATION_ID,
    name: config.name || SITE_NAME,
    ...(config.legalName ? { legalName: config.legalName } : {}),
    url: config.url || SITE_URL,
    description: config.description || DEFAULT_ORG_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: config.logoUrl || `${SITE_URL}/images/cleanstart-logo.png`,
      ...(config.logoUrl ? {} : { width: 459, height: 96 }),
    },
    sameAs,
    ...(config.alternateName ? { alternateName: config.alternateName } : {}),
    ...(config.slogan ? { slogan: config.slogan } : {}),
    ...(config.foundingDate ? { foundingDate: config.foundingDate } : {}),
    ...(config.foundingLocation
      ? { foundingLocation: { "@type": "Place", name: config.foundingLocation } }
      : {}),
    ...(config.numberOfEmployees != null
      ? { numberOfEmployees: { "@type": "QuantitativeValue", value: config.numberOfEmployees } }
      : {}),
    ...(config.email ? { email: config.email } : {}),
    ...(config.telephone ? { telephone: config.telephone } : {}),
    ...(founders.length > 0 ? { founder: founders.map(founderNode) } : {}),
    ...(hasAny(config.address) ? { address: addressNode(config.address as OrganizationAddress) } : {}),
    ...(contactPoints.length > 0 ? { contactPoint: contactPoints.map(contactPointNode) } : {}),
    ...(id?.vatID ? { vatID: id.vatID } : {}),
    ...(id?.taxID ? { taxID: id.taxID } : {}),
    ...(id?.duns ? { duns: id.duns } : {}),
    ...(id?.naics ? { naics: id.naics } : {}),
    ...(id?.iso6523 ? { iso6523Code: id.iso6523 } : {}),
    ...(news
      ? {
          ...(news.foundingDate ? { foundingDate: news.foundingDate } : {}),
          ...(news.slogan ? { slogan: news.slogan } : {}),
          ...(news.masthead ? { masthead: news.masthead } : {}),
          ...(news.ethicsPolicy ? { ethicsPolicy: news.ethicsPolicy } : {}),
          ...(news.correctionsPolicy ? { correctionsPolicy: news.correctionsPolicy } : {}),
          ...(news.factCheckingPolicy
            ? { verificationFactCheckingPolicy: news.factCheckingPolicy }
            : {}),
          ...(news.actionableFeedbackPolicy
            ? { actionableFeedbackPolicy: news.actionableFeedbackPolicy }
            : {}),
          ...(news.unnamedSourcesPolicy ? { unnamedSourcesPolicy: news.unnamedSourcesPolicy } : {}),
          ...(news.diversityPolicy ? { diversityPolicy: news.diversityPolicy } : {}),
          ...(news.ownershipFundingInfo ? { ownershipFundingInfo: news.ownershipFundingInfo } : {}),
          ...(news.coveragePolicy
            ? { missionCoveragePrioritiesPolicy: news.coveragePolicy }
            : {}),
        }
      : {}),
  };
}

/**
 * WebSite node — binds the domain to the canonical brand name/entity (the
 * `name`/`url` Google uses for the bold site name above results) and lets other
 * nodes reference it via `@id`. A `SearchAction`/sitelinks-searchbox is
 * deliberately omitted: it requires a public `/search?q=` results page, and the
 * site only exposes a JSON `/api/search` endpoint — emitting a SearchAction that
 * points at a non-existent results page would be invalid. Add it here once a
 * user-facing search page exists.
 */
export function webSiteSchema(config: { name?: string; url?: string } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: config.url || SITE_URL,
    name: config.name || SITE_NAME,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Schema.org WebPage @type and its functional subtypes. These are emitted as a
 * page-level node for STATIC routes (driven by `pageRegistry.webPageType`) so a
 * marketing page declares what kind of page it is — AboutPage for /about-us,
 * ContactPage for a contact/demo page, CollectionPage for a listing index.
 */
export type WebPageVariant =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "ProfilePage";

export interface WebPageInput {
  type: WebPageVariant;
  /** Path-only, e.g. `/about-us`. */
  path: string;
  /** Page title (the `name` Google shows). */
  name: string;
  description?: string;
  /** Path-only of a primary image, e.g. `/images/about/hero.png`. */
  primaryImagePath?: string;
}

/**
 * Page-level WebPage (or subtype) node. References the site-wide WebSite via
 * `@id` so it joins the graph rather than duplicating site identity. `@id` is
 * `<url>#webpage` — stable per route and distinct from any content node's @id.
 */
export function webPageSchema({ type, path, name, description, primaryImagePath }: WebPageInput) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    isPartOf: { "@id": WEBSITE_ID },
    ...(description ? { description } : {}),
    ...(primaryImagePath
      ? { primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(primaryImagePath) } }
      : {}),
  };
}

export type BreadcrumbCrumb = {
  /** Display label, e.g. "Blogs" */
  name: string;
  /** Path-only, e.g. `/blogs`. Last crumb may omit it for self-reference. */
  path?: string;
};

export function breadcrumbSchema(crumbs: BreadcrumbCrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absoluteUrl(c.path) } : {}),
    })),
  };
}

export interface BlogPostingSchemaInput {
  title: string;
  description?: string | undefined;
  path: string;
  publishedAt?: string | undefined;
  modifiedAt?: string | undefined;
  imageUrl?: string | undefined;
  /** Provide `slug` to emit `url: /author/<slug>` on each Person node (E-E-A-T signal). */
  authors?: Array<{ name: string; slug?: string | undefined }> | undefined;
  category?: string | undefined;
  /** Site-relative paths (`/blogs/foo`) for editorially-linked sibling posts. */
  relatedLinks?: string[] | undefined;
}

export function blogPostingSchema({
  title,
  description,
  path,
  publishedAt,
  modifiedAt,
  imageUrl,
  authors,
  category,
  relatedLinks,
}: BlogPostingSchemaInput) {
  const lastModified = modifiedAt ?? publishedAt;
  const cleanRelatedLinks =
    relatedLinks && relatedLinks.length > 0
      ? relatedLinks.map((p) => absoluteUrl(p))
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    headline: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(lastModified ? { dateModified: lastModified } : {}),
    ...(authors && authors.length > 0
      ? {
          author: authors.map(authorNode),
        }
      : {}),
    ...(category ? { articleSection: category } : {}),
    ...(cleanRelatedLinks ? { relatedLink: cleanRelatedLinks } : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface ArticleSchemaInput {
  title: string;
  description?: string | undefined;
  path: string;
  publishedAt?: string | undefined;
  modifiedAt?: string | undefined;
  imageUrl?: string | undefined;
  type?: string | undefined;
  /** Provide `slug` to emit `url: /author/<slug>` on each Person node (E-E-A-T signal). */
  authors?: Array<{ name: string; slug?: string | undefined }> | undefined;
}

export function articleSchema({
  title,
  description,
  path,
  publishedAt,
  modifiedAt,
  imageUrl,
  type,
  authors,
}: ArticleSchemaInput) {
  const lastModified = modifiedAt ?? publishedAt;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    headline: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(lastModified ? { dateModified: lastModified } : {}),
    ...(authors && authors.length > 0
      ? {
          author: authors.map(authorNode),
        }
      : {}),
    ...(type ? { genre: type } : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface NewsArticleSchemaInput {
  title: string;
  description?: string | undefined;
  path: string;
  publishedAt?: string | undefined;
  modifiedAt?: string | undefined;
  imageUrl?: string | undefined;
  /** Section (e.g. "Press release", "Product update") — maps to schema.org/articleSection. */
  section?: string | undefined;
  /** Authors — provide `slug` to emit `url: /author/<slug>` on each Person node. */
  authors?: Array<{ name: string; slug?: string | undefined }> | undefined;
}

/**
 * NewsArticle is the schema.org subtype Google Search prefers for newsroom /
 * press-release posts; it unlocks the "Top stories" rich-result eligibility
 * that the generic Article type does not. Use this on `app/news/[slug]/page.tsx`
 * — keep `articleSchema` for evergreen / non-newsroom long-form.
 */
export function newsArticleSchema({
  title,
  description,
  path,
  publishedAt,
  modifiedAt,
  imageUrl,
  section,
  authors,
}: NewsArticleSchemaInput) {
  const lastModified = modifiedAt ?? publishedAt;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    headline: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(lastModified ? { dateModified: lastModified } : {}),
    ...(section ? { articleSection: section } : {}),
    ...(authors && authors.length > 0
      ? {
          author: authors.map(authorNode),
        }
      : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface EventSchemaInput {
  title: string;
  path: string;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  /** Free-text venue name → Place.name. */
  venue: string;
  /** ISO 3166-1 alpha-2 (e.g. "IN"); when set, emits a PostalAddress. */
  addressCountry?: string | undefined;
  description?: string | null | undefined;
  /** 'scheduled' | 'postponed' | 'cancelled'. */
  eventStatus: string;
  previousStartDate?: string | null | undefined;
  imageUrl?: string | undefined;
}

/**
 * Event structured data for `/event/[slug]`. Offline (in-person) events; emits
 * `organizer` (→ Organization) and a structured `PostalAddress` (from the
 * event's country) so Google's Event rich result has the location fields it
 * recommends, not just a bare venue name.
 */
export function eventSchema({
  title,
  path,
  startDate,
  endDate,
  venue,
  addressCountry,
  description,
  eventStatus,
  previousStartDate,
  imageUrl,
}: EventSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    url: absoluteUrl(path),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    eventStatus: EVENT_STATUS_IRI[eventStatus] ?? EVENT_STATUS_IRI.scheduled,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: venue,
      ...(addressCountry
        ? { address: { "@type": "PostalAddress", addressCountry } }
        : {}),
    },
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(previousStartDate ? { previousStartDate } : {}),
    organizer: { "@id": ORGANIZATION_ID },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQPage structured data. Use on pages with a genuine list of question/answer
 * pairs (guides, support pages). Answers are plain text — callers must strip
 * any markup before passing.
 */
export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface SoftwareApplicationSchemaInput {
  name: string;
  description?: string | undefined;
  path: string;
  /** schema.org applicationCategory; defaults to "SecurityApplication". */
  applicationCategory?: string | undefined;
  /** Defaults to "Linux". */
  operatingSystem?: string | undefined;
  imageUrl?: string | undefined;
}

/**
 * SoftwareApplication for product pages (CleanStart Images, CleanSight).
 * We omit `offers` / `aggregateRating` deliberately — there's no public
 * pricing or review corpus, so this gives entity clarity (Knowledge Graph)
 * without claiming a rich-result eligibility we can't substantiate.
 */
export function softwareApplicationSchema({
  name,
  description,
  path,
  applicationCategory,
  operatingSystem,
  imageUrl,
}: SoftwareApplicationSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    ...(description ? { description } : {}),
    url: absoluteUrl(path),
    applicationCategory: applicationCategory ?? "SecurityApplication",
    operatingSystem: operatingSystem ?? "Linux",
    ...(imageUrl ? { image: [imageUrl] } : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface JobPostingSchemaInput {
  title: string;
  /** Plain-text or HTML job description. Required by Google for JobPosting. */
  description: string;
  path: string;
  datePosted?: string | undefined;
  validThrough?: string | undefined;
  /** Already mapped to a schema.org enum (FULL_TIME, PART_TIME, CONTRACTOR, INTERN). */
  employmentType?: string | undefined;
  locations?: ReadonlyArray<{
    name: string;
    isoCountry: string;
    type: "country" | "region" | "city";
  }> | undefined;
  remote?: boolean | undefined;
  baseSalary?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
  } | undefined;
  /** Stable per-posting identifier (the job slug). */
  identifier?: string | undefined;
}

export function jobPostingSchema({
  title,
  description,
  path,
  datePosted,
  validThrough,
  employmentType,
  locations,
  remote,
  baseSalary,
  identifier,
}: JobPostingSchemaInput) {
  const hasSalary =
    baseSalary != null &&
    (baseSalary.min != null || baseSalary.max != null);

  const jobLocation =
    locations && locations.length > 0
      ? locations.map((l) => ({
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            ...(l.type === "city" ? { addressLocality: l.name } : {}),
            ...(l.type === "region" ? { addressRegion: l.name } : {}),
            addressCountry: l.isoCountry,
          },
        }))
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    ...(jobLocation ? { jobLocation } : {}),
    ...(remote ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(hasSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: baseSalary?.currency ?? "USD",
            value: {
              "@type": "QuantitativeValue",
              ...(baseSalary?.min != null ? { minValue: baseSalary.min } : {}),
              ...(baseSalary?.max != null ? { maxValue: baseSalary.max } : {}),
              unitText: "YEAR",
            },
          },
        }
      : {}),
    ...(identifier
      ? {
          identifier: {
            "@type": "PropertyValue",
            name: SITE_NAME,
            value: identifier,
          },
        }
      : {}),
    url: absoluteUrl(path),
  };
}

export interface VideoObjectSchemaInput {
  name: string;
  description?: string | undefined;
  contentUrl: string;
  /** ISO-8601 date string. Required by Google for VideoObject rich results. */
  uploadDate?: string | undefined;
  /** Thumbnail image URL. Required by Google for VideoObject rich results. */
  thumbnailUrl?: string | undefined;
  /** Page path where the video appears, e.g. `/knowledge-hub/my-article`. */
  embedPath?: string | undefined;
  /**
   * Absolute player URL, for videos hosted by a third party (e.g. the
   * youtube-nocookie embed). Takes precedence over `embedPath`, which resolves
   * against our own origin and is only correct for self-hosted players.
   */
  embedUrl?: string | undefined;
  /** ISO-8601 duration, e.g. `PT2M39S`. Recommended by Google. */
  duration?: string | undefined;
}

/**
 * VideoObject for lesson videos (Knowledge Hub "Watch the Lesson" player) and
 * product videos embedded in marketing pages. `thumbnailUrl` and `uploadDate`
 * are required for Google's video rich results — callers should provide them
 * when available.
 */
export function videoObjectSchema({
  name,
  description,
  contentUrl,
  uploadDate,
  thumbnailUrl,
  embedPath,
  embedUrl,
  duration,
}: VideoObjectSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    ...(description ? { description } : {}),
    contentUrl,
    ...(uploadDate ? { uploadDate } : {}),
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(duration ? { duration } : {}),
    ...(embedUrl
      ? { embedUrl }
      : embedPath
        ? { embedUrl: absoluteUrl(embedPath) }
        : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface PodcastSeriesSchemaInput {
  name: string;
  description?: string | undefined;
  path: string;
}

export function podcastSeriesSchema({ name, description, path }: PodcastSeriesSchemaInput) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "@id": `${url}#series`,
    name,
    ...(description ? { description } : {}),
    url,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface WebinarListItem {
  title: string;
  abstract?: string | null | undefined;
  startsAt?: string | null | undefined;
  endsAt?: string | null | undefined;
  eventStatus: string;
  registrationUrl?: string | null | undefined;
}

const WEBINAR_EVENT_STATUS: Record<string, string> = {
  scheduled: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  cancelled: "https://schema.org/EventCancelled",
};

export function webinarListSchema(webinars: WebinarListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "CleanStart Webinars",
    url: absoluteUrl("/webinars"),
    numberOfItems: webinars.length,
    itemListElement: webinars.slice(0, 20).map((w, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: w.title,
        ...(w.abstract ? { description: w.abstract } : {}),
        ...(w.startsAt ? { startDate: w.startsAt } : {}),
        ...(w.endsAt ? { endDate: w.endsAt } : {}),
        eventStatus: WEBINAR_EVENT_STATUS[w.eventStatus] ?? WEBINAR_EVENT_STATUS.scheduled,
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: {
          "@type": "VirtualLocation",
          url: w.registrationUrl ?? absoluteUrl("/webinars"),
        },
        url: w.registrationUrl ?? absoluteUrl("/webinars"),
        organizer: { "@id": ORGANIZATION_ID },
      },
    })),
  };
}

export interface CaseStudyListItem {
  title: string;
  summary: string;
  company: string;
  publishedAt?: string | null | undefined;
  /** Slug of the case study. Emitted as a `#slug` fragment so each entry has a
   *  distinct, deep-linkable URL; the listing renders a matching element id. */
  slug?: string | null | undefined;
  /** Absolute cover-image URL. Google's Article guidance recommends `image`. */
  imageUrl?: string | null | undefined;
}

export function caseStudyListSchema(items: CaseStudyListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "CleanStart Customer Case Studies",
    url: absoluteUrl("/case-studies"),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Article",
        headline: s.title,
        description: s.summary,
        about: s.company,
        // Distinct per entry. Every item previously carried the bare listing
        // URL, so nothing could deep-link to a specific customer story. The
        // listing renders `id="<slug>"` on each card, so the fragment resolves.
        url: s.slug
          ? `${absoluteUrl("/case-studies")}#${s.slug}`
          : absoluteUrl("/case-studies"),
        ...(s.imageUrl ? { image: [s.imageUrl] } : {}),
        // Case studies are corporate-authored; the Organization is the honest
        // author as well as the publisher.
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        ...(s.publishedAt ? { datePublished: s.publishedAt } : {}),
      },
    })),
  };
}

export interface ItemListEntry {
  /** Item title (ListItem.name). */
  name: string;
  /** Site-relative detail path, e.g. `/blogs/foo`. */
  path: string;
}

/**
 * Generic ItemList for a content listing page (blogs, news, guide, events,
 * resource-center, careers). Each ListItem points at the detail URL so crawlers
 * and answer engines see the set + order without needing to render the
 * client-side card grid. Capped at 30 to keep the payload lean.
 */
export function itemListSchema(name: string, listPath: string, items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(listPath),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(it.path),
      name: it.name,
    })),
  };
}

export interface ProfilePageSchemaInput {
  name: string;
  slug: string;
  /** Job title / role. */
  jobTitle?: string | undefined;
  /** Absolute URL of the author's profile photo. */
  imageUrl?: string | undefined;
  /** Plain-text short bio. */
  description?: string | undefined;
  /** Canonical profile URLs on external platforms (LinkedIn, Twitter, etc.). */
  sameAs?: string[] | undefined;
}

/**
 * ProfilePage wrapping a Person mainEntity — Google's recommended type for
 * author bio pages. Emitting this enables E-E-A-T author disambiguation and
 * links back from Article/BlogPosting Person nodes via the `url` property.
 */
export function profilePageSchema({
  name,
  slug,
  jobTitle,
  imageUrl,
  description,
  sameAs,
}: ProfilePageSchemaInput) {
  const profileUrl = absoluteUrl(`/author/${slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: profileUrl,
    mainEntity: {
      "@type": "Person",
      "@id": `${profileUrl}#person`,
      name,
      url: profileUrl,
      ...(jobTitle ? { jobTitle } : {}),
      ...(imageUrl ? { image: imageUrl } : {}),
      ...(description ? { description } : {}),
      ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
    },
  };
}

export interface ReviewSourceInput {
  name: string;
  role: string;
  company: string;
  quote: string;
}

/**
 * Review nodes for genuine, named customer testimonials, attached to the
 * Organization via ORGANIZATION_ID. Unlike every other builder in this file,
 * returns one node per input entry rather than a single node — each
 * testimonial is its own top-level graph member.
 *
 * Deliberately emits no `reviewRating`: no numeric rating is collected from
 * these customers, and inventing one to unlock a star rich result would be
 * fabricated structured data. A Review without a rating is valid and honest
 * (see the Review rule in validate/rich-result-lint.ts, where reviewRating
 * is recommended, not required).
 *
 * Entries missing a name or quote are skipped — an unattributed review is
 * worse than no review.
 */
export function reviewSchema(sources: readonly ReviewSourceInput[]) {
  return sources
    .filter((s) => s.name.trim().length > 0 && s.quote.trim().length > 0)
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "Review",
      reviewBody: s.quote,
      itemReviewed: { "@id": ORGANIZATION_ID },
      author: {
        "@type": "Person",
        name: s.name,
        jobTitle: s.role,
        affiliation: { "@type": "Organization", name: s.company },
      },
    }));
}
