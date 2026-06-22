import type { Metadata } from "next";
import { isIndexingAllowed } from "./indexing";
import { ogImageUrl, type OgVariant } from "./og";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com";
export const SITE_NAME = "CleanStart";

// Trailing " | CleanStart" (and `-`/`–`/`—`/`:` separator variants). Webflow-
// imported `seo.title` values often already carry the brand, which the root
// layout's `%s | CleanStart` template would then append a second time
// ("… | CleanStart | CleanStart"). Stripped before the template is applied.
const BRAND_SUFFIX = /\s*[|–—\-:]\s*CleanStart\s*$/i;

/**
 * Remove any trailing brand suffix(es) from a title so the layout title
 * template adds exactly one. Idempotent and loop-safe — collapses an
 * already-doubled title down to the bare title. Never strips a title that is
 * only "CleanStart" (no separator), so a legitimately brand-named page survives.
 */
export function stripBrandSuffix(title: string): string {
  let t = title.trim();
  while (BRAND_SUFFIX.test(t)) t = t.replace(BRAND_SUFFIX, "").trim();
  return t || title.trim();
}

export type PageImage = {
  url: string;
  width?: number | undefined;
  height?: number | undefined;
  alt: string;
};

interface BuildPageMetadataInput {
  title: string;
  description: string;
  /**
   * When true, `title` is used as the absolute document `<title>` and the
   * root layout's `%s | CleanStart` template is bypassed. Use for pages whose
   * title already carries the brand suffix (e.g. exact-matched legacy titles).
   */
  absoluteTitle?: boolean | undefined;
  /** Path-only canonical, e.g. `/blogs` or `/blogs/${slug}`. Always with a leading slash. */
  path: string;
  image?: PageImage | undefined;
  /** `article` for blog/resource detail pages, `website` everywhere else. */
  type?: "website" | "article" | undefined;
  publishedTime?: string | undefined;
  modifiedTime?: string | undefined;
  authors?: string[] | undefined;
  /** Per-page noindex override. Default follows the global production gate. */
  noindex?: boolean | undefined;
  /**
   * Add `nofollow` to the robots directive. Off by default: a per-page
   * `noindex` still emits `follow` so crawlers pass link equity through and
   * discover linked pages. Set true only for an explicit `noindex,nofollow`
   * intent (the staging indexing-gate forces nofollow regardless).
   */
  nofollow?: boolean | undefined;
  /**
   * Absolute canonical URL override (any domain). When set, replaces the
   * default self-canonical derived from `path`. Used for the CMS
   * `seo.canonicalOverride` field (syndication, migrated URLs, A/B variants).
   */
  canonicalUrl?: string | undefined;
  /** Card composition: "hero" for flagship pages, "default" elsewhere. */
  variant?: OgVariant | undefined;
  /** Type/category label shown as the OG eyebrow + footer meta (e.g. "Blog"). */
  eyebrow?: string | undefined;
  /** Substring of the card title rendered in the gradient. */
  titleAccent?: string | undefined;
  /** Overrides the card title only (page <title> stays `title`). */
  ogTitle?: string | undefined;
}

/**
 * Build a Next.js Metadata object with consistent canonical, OpenGraph, and
 * Twitter fields. Every page should call this so og:image:alt and the canonical
 * URL can never be forgotten.
 */
export function buildPageMetadata({
  title,
  description,
  absoluteTitle,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  noindex,
  nofollow,
  canonicalUrl,
  variant,
  eyebrow,
  titleAccent,
  ogTitle,
}: BuildPageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;
  // Build-time gate (no request host) — the per-host backstop is proxy.ts.
  const gateBlocked = !isIndexingAllowed();
  const robotsBlocked = noindex || gateBlocked;
  // A per-page noindex still follows links (equity flows, linked pages stay
  // discoverable); the staging gate-block and an explicit nofollow are full
  // no-follow.
  const robotsFollow = gateBlocked ? false : !nofollow;

  // `absoluteTitle` callers own the full <title> (brand included) and bypass the
  // layout template, so leave theirs untouched. Everyone else gets the brand
  // stripped here so the `%s | CleanStart` template can't double it.
  const cleanTitle = absoluteTitle ? title : stripBrandSuffix(title);

  const dynamicOg = {
    url: ogImageUrl({
      variant,
      title: ogTitle ?? cleanTitle,
      eyebrow,
      titleAccent,
      sub: description,
    }),
    width: 1200,
    height: 630,
    alt: image?.alt ?? cleanTitle,
  };
  const ogImage = image ?? dynamicOg;
  const canonical = canonicalUrl ?? path;
  const ogUrl = canonicalUrl ?? url;

  return {
    title: absoluteTitle ? { absolute: title } : cleanTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: cleanTitle,
      description,
      url: ogUrl,
      siteName: SITE_NAME,
      type,
      locale: "en_US",
      images: [
        {
          url: ogImage.url,
          width: ogImage.width ?? 1200,
          height: ogImage.height ?? 630,
          alt: ogImage.alt,
        },
      ],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description,
      images: [{ url: ogImage.url, alt: ogImage.alt }],
    },
    robots: robotsBlocked
      ? {
          index: false,
          follow: robotsFollow,
          googleBot: { index: false, follow: robotsFollow },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface ListingMetadataInput {
  title: string;
  description: string;
  /** Clean base path, e.g. `/blogs` — no trailing slash, no query string. */
  basePath: string;
  eyebrow?: string | undefined;
  variant?: OgVariant | undefined;
}

/**
 * Metadata for paginated listing pages. Rules:
 *   page 1 (or absent) → canonical = basePath, fully indexed
 *   pages 2–5          → self-canonical with ?page=N, fully indexed
 *   pages 6+           → self-canonical + noindex, follow:true (too deep to index,
 *                         but crawlers should still follow links to discover articles)
 */
export function buildListingMetadata(
  input: ListingMetadataInput,
  page: number,
): Metadata {
  const p = Math.max(1, Number.isFinite(page) ? page : 1);
  const canonicalPath = p <= 1 ? input.basePath : `${input.basePath}?page=${p}`;
  const isDeepPage = p >= 6;

  const metadata = buildPageMetadata({
    title: input.title,
    description: input.description,
    path: canonicalPath,
    eyebrow: input.eyebrow,
    variant: input.variant,
    noindex: isDeepPage,
  });

  if (isDeepPage) {
    // buildPageMetadata sets follow:false when noindex:true; override to
    // follow:true so crawlers can still reach article URLs on deep pages.
    return { ...metadata, robots: { index: false, follow: true } };
  }

  return metadata;
}
