import type { PageImage } from "./canonical";

/**
 * The subset of the CMS `seo` field group that the web layer consumes today.
 *
 * The CMS group has more fields (robotsAdvanced, alternates, customTags,
 * additionalSchema, twitter/og advanced). Those are intentionally NOT wired
 * here yet:
 *  - `additionalSchema` is field-level admin-read-only, so an anonymous web
 *    fetch never receives it.
 *  - robots-advanced / hreflang / custom tags need the web-side composition
 *    libraries (composeRobotsMeta / composeHreflangCluster / composeCustomTags)
 *    which do not exist in apps/web yet.
 * Both are tracked as a follow-up in docs/web/SEO-IMPLEMENTATION-PLAN.md (Task 0.5).
 */
export type CmsSeoImage = {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type CmsSeoIndexable = "index" | "noindex" | "noindex,nofollow";

export type CmsSeo = {
  title?: string | null;
  description?: string | null;
  indexable?: CmsSeoIndexable | null;
  /** Populated media object at depth ≥ 1; a bare id (string/number) at depth 0. */
  ogImage?: CmsSeoImage | string | number | null;
  ogImageAlt?: string | null;
  useCustomCanonical?: boolean | null;
  canonicalOverride?: string | null;
};

export interface CmsSeoResolution {
  title?: string;
  description?: string;
  image?: PageImage;
  noindex?: boolean;
  /** Absolute https canonical URL when the editor set a custom canonical. */
  canonicalUrl?: string;
}

/**
 * Resolve the editor-set `seo.*` fields into the override shape
 * `buildPageMetadata` accepts. Every field falls back to the base document
 * value at the call site (e.g. `resolved.title ?? doc.title`).
 */
export function resolveCmsSeo(
  seo: CmsSeo | null | undefined,
  opts: { absolutize: (url: string | null | undefined) => string | undefined },
): CmsSeoResolution {
  if (!seo) return {};

  const resolution: CmsSeoResolution = {};

  if (seo.title) resolution.title = seo.title;
  if (seo.description) resolution.description = seo.description;
  if (seo.indexable && seo.indexable !== "index") resolution.noindex = true;
  if (seo.useCustomCanonical && seo.canonicalOverride) {
    resolution.canonicalUrl = seo.canonicalOverride;
  }

  if (seo.ogImage && typeof seo.ogImage === "object") {
    const url = opts.absolutize(seo.ogImage.url);
    if (url) {
      resolution.image = {
        url,
        alt: seo.ogImageAlt ?? seo.ogImage.alt ?? "",
        ...(seo.ogImage.width ? { width: seo.ogImage.width } : {}),
        ...(seo.ogImage.height ? { height: seo.ogImage.height } : {}),
      };
    }
  }

  return resolution;
}
