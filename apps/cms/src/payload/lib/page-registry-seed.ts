/**
 * Canonical list of every apps/web route, seeded into the `pageRegistry`
 * collection so the Schema Manager dashboard can list every page — including
 * the hardcoded static pages that have no content document.
 *
 * Source of truth: docs/web/WEB-PAGES.md + apps/web/src/lib/nav-config.ts.
 * Keep in sync when a page is added/removed/renamed.
 *
 * `kind`:
 *  - static       → hardcoded React page (no CMS doc). Owns its schema here.
 *  - cms-listing  → a collection's index page (also no per-page doc).
 *  - cms-template → a dynamic detail route ([slug]); schema is edited on each
 *                   document, this row just deep-links into the collection.
 */

export type PageKind = 'static' | 'cms-listing' | 'cms-template';

export interface PageRegistrySeedRow {
  path: string;
  title: string;
  kind: PageKind;
  backingCollection?: string;
}

export const PAGE_REGISTRY_SEED: readonly PageRegistrySeedRow[] = [
  // Static pages — hardcoded React, schema owned via the registry override.
  { path: '/', title: 'Home', kind: 'static' },
  { path: '/about-us', title: 'About Us', kind: 'static' },
  { path: '/attack-surface-reduction', title: 'Attack Surface Reduction', kind: 'static' },
  { path: '/book-a-demo', title: 'Book a Demo', kind: 'static' },
  { path: '/clean-libraries', title: 'Clean Libraries', kind: 'static' },
  { path: '/cleansight', title: 'CleanSight', kind: 'static' },
  { path: '/cleanstart-images', title: 'CleanStart Images', kind: 'static' },
  { path: '/cleanstart-platform', title: 'CleanStart Platform', kind: 'static' },
  { path: '/community', title: 'Community', kind: 'static' },
  { path: '/contact-us', title: 'Contact Us', kind: 'static' },
  { path: '/deal-registration', title: 'Deal Registration', kind: 'static' },
  { path: '/fips', title: 'FIPS Compliance', kind: 'static' },
  { path: '/for-ciso', title: 'For CISO', kind: 'static' },
  { path: '/for-developers', title: 'For Developers', kind: 'static' },
  { path: '/partners', title: 'Partners', kind: 'static' },
  { path: '/pricing', title: 'Pricing', kind: 'static' },
  { path: '/privacy-policy', title: 'Privacy Policy', kind: 'static' },
  { path: '/software-bill-materials', title: 'Software Bill of Materials', kind: 'static' },
  { path: '/software-composition-analysis', title: 'Software Composition Analysis', kind: 'static' },
  { path: '/teams', title: 'Teams', kind: 'static' },
  { path: '/vulnerability-remediation', title: 'Vulnerability Remediation', kind: 'static' },

  // CMS listing pages — collection index routes (no per-page document).
  { path: '/blogs', title: 'Blogs', kind: 'cms-listing', backingCollection: 'blogs' },
  { path: '/guide', title: 'Guides', kind: 'cms-listing', backingCollection: 'guides' },
  { path: '/news', title: 'Newsroom', kind: 'cms-listing', backingCollection: 'news' },
  { path: '/events', title: 'Events', kind: 'cms-listing', backingCollection: 'events' },
  { path: '/webinars', title: 'Webinars', kind: 'cms-listing', backingCollection: 'webinars' },
  { path: '/careers', title: 'Careers', kind: 'cms-listing', backingCollection: 'jobs' },
  { path: '/case-studies', title: 'Case Studies', kind: 'cms-listing', backingCollection: 'caseStudies' },
  { path: '/resource-center', title: 'Resource Center', kind: 'cms-listing', backingCollection: 'resources' },
  { path: '/podcast', title: 'Podcast', kind: 'cms-listing', backingCollection: 'podcastEpisodes' },
  { path: '/knowledge-hub', title: 'Knowledge Hub', kind: 'cms-listing', backingCollection: 'knowledgeBase' },
  { path: '/legal', title: 'Legal', kind: 'cms-listing', backingCollection: 'legalDocuments' },

  // CMS detail templates — schema edited per-document; row deep-links the set.
  { path: '/blogs/[slug]', title: 'Blog post (template)', kind: 'cms-template', backingCollection: 'blogs' },
  { path: '/news/[slug]', title: 'News article (template)', kind: 'cms-template', backingCollection: 'news' },
  { path: '/guide/[slug]', title: 'Guide (template)', kind: 'cms-template', backingCollection: 'guides' },
  { path: '/resources/[slug]', title: 'Resource (template)', kind: 'cms-template', backingCollection: 'resources' },
  { path: '/knowledge-hub/[slug]', title: 'Knowledge article (template)', kind: 'cms-template', backingCollection: 'knowledgeBase' },
  { path: '/event/[slug]', title: 'Event (template)', kind: 'cms-template', backingCollection: 'events' },
  { path: '/job/[slug]', title: 'Job posting (template)', kind: 'cms-template', backingCollection: 'jobs' },
  { path: '/author/[slug]', title: 'Author profile (template)', kind: 'cms-template', backingCollection: 'authors' },
  { path: '/legal/[slug]', title: 'Legal document (template)', kind: 'cms-template', backingCollection: 'legalDocuments' },
] as const;

/** Fail-fast guard: paths unique + well-formed, templates carry a collection. */
export function assertPageRegistrySeedValid(): void {
  const seen = new Set<string>();
  for (const row of PAGE_REGISTRY_SEED) {
    if (!row.path.startsWith('/')) {
      throw new Error(`pageRegistry seed: path must be site-relative: ${row.path}`);
    }
    if (seen.has(row.path)) {
      throw new Error(`pageRegistry seed: duplicate path: ${row.path}`);
    }
    seen.add(row.path);
    if ((row.kind === 'cms-listing' || row.kind === 'cms-template') && !row.backingCollection) {
      throw new Error(`pageRegistry seed: ${row.kind} row needs backingCollection: ${row.path}`);
    }
  }
}
