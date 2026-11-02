import { trackEvent } from "@/lib/analytics/track";

import type { BlogCtaLayout, BlogCtaPlacement, BlogCtaStage, BlogCtaSurface } from "./types";

const PAGE_BASE: Record<BlogCtaSurface, string> = { blog: "/blogs", advisory: "/advisories" };

interface CtaEvent {
  /** Defaults to the blog, so the blog's existing event names are unchanged. */
  surface?: BlogCtaSurface | undefined;
  layout: BlogCtaLayout;
  placement: BlogCtaPlacement;
  stage: BlogCtaStage;
  /** Set for interactions that are not a click-through, e.g. copying the pull command. */
  action?: "copy" | undefined;
}

/** `<surface>_<layout>_<placement>_<stage>[_copy]`, so GA4 can split layouts and slots without new dataLayer keys. */
export const ctaEventName = ({ surface = "blog", layout, placement, stage, action }: CtaEvent): string =>
  `${surface}_${layout}_${placement}_${stage}${action ? `_${action}` : ""}`;

export const ctaPagePath = (surface: BlogCtaSurface, slug: string): string => `${PAGE_BASE[surface]}/${slug}`;

/** One `cta_click` per article CTA. */
export function trackBlogCta({
  slug,
  resourceSlug,
  ...event
}: CtaEvent & {
  slug: string;
  resourceSlug?: string | undefined;
}): void {
  trackEvent("cta_click", {
    cta: ctaEventName(event),
    page: ctaPagePath(event.surface ?? "blog", slug),
    resource_slug: resourceSlug,
  });
}
