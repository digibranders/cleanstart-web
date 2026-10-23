// Client-safe blog helpers extracted from `lib/blog.ts` so client components
// (e.g. the static /blogs listing's `BlogsBrowser`/`BlogsHero`) don't
// transitively pull `next/headers` via `cms-fetch`. Mirrors `news-utils.ts`.
//
// Type-only import — erased at runtime, so this does not create a runtime cycle
// with `blog.ts` (which re-exports these for server-side backward compat).
import type { DetailKind } from "@cleanstart/schema/builders";
import type { BlogImage } from "./blog";

// `NEXT_PUBLIC_CMS_URL` is inlined at build time, so this is safe on the client
// (matches `cmsBaseUrl()` in `cms-fetch`, which we can't import here — it pulls
// `next/headers`).
const CMS_BASE = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

// Payload returns relative URLs (e.g. /api/media/file/...) when serverURL isn't
// set. Prefix them so Next.js Image can resolve them against the CMS host.
export function mediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${CMS_BASE}${url}`;
}

// Prefer a generated size variant when present. Payload's Media collection can
// drift between its `url`/`filename` and the underlying R2 object, leaving the
// canonical `url` 404'ing while the size variants — derived at upload time and
// never renamed — remain correct.
export function pickImageUrl(
  image: BlogImage | undefined | null,
  preferred: ReadonlyArray<"thumb" | "card" | "hero"> = ["card", "thumb", "hero"],
): string | undefined {
  if (!image) return undefined;
  for (const key of preferred) {
    const sized = image.sizes?.[key]?.url;
    if (sized) return mediaUrl(sized);
  }
  return mediaUrl(image.url);
}

export function formatBlogDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Which listing a blog-shaped card or page belongs to. Blogs and Advisories
 * share the listing and article components; this carries the bits that differ
 * (URL prefix, visible label, breadcrumb trail). Components default to Blogs.
 */
export interface ContentSection {
  basePath: string;
  label: string;
  subtitle: string;
  featuredLabel: string;
  searchPlaceholder: string;
  breadcrumbKind: DetailKind;
}

export const BLOGS_SECTION: ContentSection = {
  basePath: "/blogs",
  label: "Blogs",
  subtitle: "A Curated Collection of Writings, Research, and Solutions",
  featuredLabel: "FEATURED ARTICLES",
  searchPlaceholder: "Search articles of your interest...",
  breadcrumbKind: "blog",
};

export const ADVISORIES_SECTION: ContentSection = {
  basePath: "/advisories",
  label: "Advisories",
  subtitle: "Critical Vulnerabilities, Affected Versions, and Fixes",
  featuredLabel: "FEATURED ADVISORY",
  searchPlaceholder: "Search advisories...",
  breadcrumbKind: "advisory",
};
