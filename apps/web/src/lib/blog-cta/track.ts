import { trackEvent } from "@/lib/analytics/track";

import type { BlogCtaLayout, BlogCtaPlacement, BlogCtaStage } from "./types";

/**
 * One `cta_click` per blog CTA, named `blog_<layout>_<placement>_<stage>[_copy]` so
 * GA4 can split the review layouts and their slots without new dataLayer keys.
 */
export function trackBlogCta({
  layout,
  placement,
  stage,
  slug,
  resourceSlug,
  action,
}: {
  layout: BlogCtaLayout;
  placement: BlogCtaPlacement;
  stage: BlogCtaStage;
  slug: string;
  resourceSlug?: string | undefined;
  /** Set for interactions that are not a click-through, e.g. copying the pull command. */
  action?: "copy" | undefined;
}): void {
  trackEvent("cta_click", {
    cta: `blog_${layout}_${placement}_${stage}${action ? `_${action}` : ""}`,
    page: `/blogs/${slug}`,
    resource_slug: resourceSlug,
  });
}
