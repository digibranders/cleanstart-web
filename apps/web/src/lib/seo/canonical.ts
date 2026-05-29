import type { Metadata } from "next";

export const SITE_URL = "https://www.cleanstart.com";
export const SITE_NAME = "CleanStart";

export const DEFAULT_OG_IMAGE = {
  url: "/og/default.png",
  width: 1200,
  height: 630,
  alt: "CleanStart — verified container images",
} as const;

export type PageImage = {
  url: string;
  width?: number | undefined;
  height?: number | undefined;
  alt: string;
};

interface BuildPageMetadataInput {
  title: string;
  description: string;
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
   * Absolute canonical URL override (any domain). When set, replaces the
   * default self-canonical derived from `path`. Used for the CMS
   * `seo.canonicalOverride` field (syndication, migrated URLs, A/B variants).
   */
  canonicalUrl?: string | undefined;
}

/**
 * Build a Next.js Metadata object with consistent canonical, OpenGraph, and
 * Twitter fields. Every page should call this so og:image:alt and the canonical
 * URL can never be forgotten.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  noindex,
  canonicalUrl,
}: BuildPageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const isProduction = process.env.VERCEL_ENV === "production";
  const robotsBlocked = noindex || !isProduction;

  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const canonical = canonicalUrl ?? path;
  const ogUrl = canonicalUrl ?? url;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
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
      title,
      description,
      images: [{ url: ogImage.url, alt: ogImage.alt }],
    },
    robots: robotsBlocked
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
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
