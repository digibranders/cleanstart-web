import { trackEvent } from "@/lib/analytics/track";

import type { BlogCtaLayout, BlogCtaPlacement, BlogCtaStage } from "./types";

/**
 * One `cta_click` per blog CTA, named `blog_<layout>_<placement>_<stage>` so
 * GA4 can split the review layouts and their slots without new dataLayer keys.
 */
export function trackBlogCta({
  layout,
  placement,
  stage,
  slug,
  resourceSlug,
}: {
  layout: BlogCtaLayout;
  placement: BlogCtaPlacement;
  stage: BlogCtaStage;
  slug: string;
  resourceSlug?: string | undefined;
}): void {
  trackEvent("cta_click", {
    cta: `blog_${layout}_${placement}_${stage}`,
    page: `/blogs/${slug}`,
    resource_slug: resourceSlug,
  });
}
