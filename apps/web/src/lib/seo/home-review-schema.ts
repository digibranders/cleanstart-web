import type { GraphNode } from "@cleanstart/schema";
import type { Testimonial } from "@/components/sections/home/testimonials-data";
import { SITE_URL } from "./canonical";

/**
 * Review nodes for the genuine, named customer testimonials rendered on the
 * homepage, attached to the Organization via its @id.
 *
 * Deliberately emits no `reviewRating`: no numeric rating is collected from
 * these customers, and inventing one to unlock a star rich result would be
 * fabricated structured data. A Review without a rating is valid and honest.
 *
 * Testimonials missing a name or quote are skipped — an unattributed review
 * is worse than no review.
 */
export function homeReviewSchema(testimonials: readonly Testimonial[]): GraphNode[] {
  return testimonials
    .filter((t) => t.name.trim().length > 0 && t.quote.trim().length > 0)
    .map((t) => ({
      "@type": "Review",
      reviewBody: t.quote,
      itemReviewed: { "@id": `${SITE_URL}/#organization` },
      author: {
        "@type": "Person",
        name: t.name,
        jobTitle: t.role,
        affiliation: { "@type": "Organization", name: t.company },
      },
    }));
}
