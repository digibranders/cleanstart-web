import type { BlogCtaLayout, BlogCtaPlacement } from "./types";

/**
 * Tags an internal demo link with where the click came from.
 *
 * Deliberately not `utm_*`: on an internal link those start a new GA4 session
 * and replace the lead's last-touch campaign, so a visitor who arrived from a
 * paid click would be credited to the blog. These params leave attribution
 * alone; GA4 still records them inside `page_location`.
 */
export function withDemoSource(
  href: string,
  { slug, layout, placement }: { slug: string; layout: BlogCtaLayout; placement: BlogCtaPlacement },
): string {
  const url = new URL(href, "https://www.cleanstart.com");
  url.searchParams.set("source", "blog");
  url.searchParams.set("source_page", slug);
  url.searchParams.set("source_cta", `${layout}-${placement}`);
  return `${url.pathname}${url.search}${url.hash}`;
}
