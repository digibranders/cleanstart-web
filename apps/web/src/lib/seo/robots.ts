import { SITE_URL } from "@/lib/seo/canonical";

/**
 * Content Signals (https://contentsignals.org/) — machine-readable usage
 * preferences declared per robots.txt group. The values mirror the documented
 * AI-crawler policy (docs/web/WEB-PRODUCTION.md §8: allow all AI crawlers
 * except Bytespider), so all three categories are `yes` on production.
 */
export const CONTENT_SIGNALS = "search=yes, ai-input=yes, ai-train=yes";

const SIGNALS_PREAMBLE = `# Content Signals (https://contentsignals.org/)
# search:   building a search index and providing search results
# ai-input: inputting content into one or more AI models (e.g. RAG, grounding)
# ai-train: training or fine-tuning AI models
# yes = the operator grants permission for that use; no = the operator does not.`;

/**
 * Builds the robots.txt body. A plain-text route handler (not Next's
 * `robots.ts` metadata route) serves it because `MetadataRoute.Robots` cannot
 * emit non-standard directives like `Content-Signal`.
 */
export function buildRobotsTxt({ indexable }: { indexable: boolean }): string {
  if (!indexable) {
    return [
      "User-Agent: *",
      "Content-Signal: search=no, ai-input=no, ai-train=no",
      "Disallow: /",
      "",
    ].join("\n");
  }

  // Allow all AI crawlers except Bytespider. ByteDance's Bytespider ignores
  // robots.txt, so the disallow here is symbolic — it is backed by a Vercel
  // Firewall rule matching on User-Agent.
  return [
    SIGNALS_PREAMBLE,
    "",
    "User-Agent: *",
    `Content-Signal: ${CONTENT_SIGNALS}`,
    "Allow: /",
    "Disallow: /preview/",
    "Disallow: /api/preview/",
    // Next.js App Router appends `?_rsc=<hash>` to in-viewport <Link> prefetch
    // fetches (Content-Type text/x-component). They are internal navigation
    // payloads, never indexable pages, and each is already canonicalised to its
    // clean URL — so blocking them only reclaims crawl budget. Real browser
    // navigation ignores robots.txt, so this is crawler-only.
    "Disallow: /*_rsc=",
    "",
    "User-Agent: Bytespider",
    "Disallow: /",
    "",
    `Host: ${SITE_URL}`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}
