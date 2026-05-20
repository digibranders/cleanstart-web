import { SITE_NAME, SITE_URL, absoluteUrl } from "./canonical";

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

// ---------- Schema builders ---------------------------------------------------

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/cleanstart-logo.svg`,
    },
    sameAs: [
      "https://www.linkedin.com/company/cleanstart",
      "https://github.com/cleanstart",
    ],
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
  authors?: Array<{ name: string }> | undefined;
  category?: string | undefined;
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
}: BlogPostingSchemaInput) {
  const lastModified = modifiedAt ?? publishedAt;
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
          author: authors.map((a) => ({ "@type": "Person", name: a.name })),
        }
      : {}),
    ...(category ? { articleSection: category } : {}),
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
}

export function articleSchema({
  title,
  description,
  path,
  publishedAt,
  modifiedAt,
  imageUrl,
  type,
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
  /** Author names — added as a `Person[]` array per Google news rich-result guidance. */
  authors?: Array<{ name: string }> | undefined;
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
          author: authors.map((a) => ({ "@type": "Person", name: a.name })),
        }
      : {}),
    publisher: { "@id": ORGANIZATION_ID },
  };
}
