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
 *
 * `schemaType` → the primary Schema.org type the page represents (the
 * rich-result type to aim for). Aligned with what the site actually emits.
 */

export type PageKind = 'static' | 'cms-listing' | 'cms-template';

export type PageSchemaType =
  | 'WebPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'CollectionPage'
  | 'SoftwareApplication'
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'Event'
  | 'JobPosting'
  | 'ProfilePage';

export interface PageRegistrySeedRow {
  path: string;
  title: string;
  kind: PageKind;
  schemaType: PageSchemaType;
  backingCollection?: string;
}

export const PAGE_REGISTRY_SEED: readonly PageRegistrySeedRow[] = [
  // Static pages — hardcoded React, schema owned via the registry override.
  { path: '/', title: 'Home', kind: 'static', schemaType: 'WebPage' },
  { path: '/about-us', title: 'About Us', kind: 'static', schemaType: 'AboutPage' },
  { path: '/attack-surface-reduction', title: 'Attack Surface Reduction', kind: 'static', schemaType: 'WebPage' },
  { path: '/book-a-demo', title: 'Book a Demo', kind: 'static', schemaType: 'ContactPage' },
  { path: '/clean-libraries', title: 'Clean Libraries', kind: 'static', schemaType: 'SoftwareApplication' },
  { path: '/cleansight', title: 'CleanSight', kind: 'static', schemaType: 'SoftwareApplication' },
  { path: '/cleanstart-images', title: 'CleanStart Images', kind: 'static', schemaType: 'SoftwareApplication' },
  { path: '/cleanstart-platform', title: 'CleanStart Platform', kind: 'static', schemaType: 'WebPage' },
  { path: '/community', title: 'Community', kind: 'static', schemaType: 'WebPage' },
  { path: '/contact-us', title: 'Contact Us', kind: 'static', schemaType: 'ContactPage' },
  { path: '/deal-registration', title: 'Deal Registration', kind: 'static', schemaType: 'ContactPage' },
  { path: '/fips', title: 'FIPS Compliance', kind: 'static', schemaType: 'WebPage' },
  { path: '/for-ciso', title: 'For CISO', kind: 'static', schemaType: 'WebPage' },
  { path: '/for-developers', title: 'For Developers', kind: 'static', schemaType: 'WebPage' },
  { path: '/partners', title: 'Partners', kind: 'static', schemaType: 'WebPage' },
  { path: '/pricing', title: 'Pricing', kind: 'static', schemaType: 'WebPage' },
  { path: '/privacy-policy', title: 'Privacy Policy', kind: 'static', schemaType: 'WebPage' },
  { path: '/software-bill-materials', title: 'Software Bill of Materials', kind: 'static', schemaType: 'WebPage' },
  { path: '/software-composition-analysis', title: 'Software Composition Analysis', kind: 'static', schemaType: 'WebPage' },
  { path: '/teams', title: 'Teams', kind: 'static', schemaType: 'WebPage' },
  { path: '/vulnerability-remediation', title: 'Vulnerability Remediation', kind: 'static', schemaType: 'WebPage' },

  // CMS listing pages — collection index routes (no per-page document).
  { path: '/blogs', title: 'Blogs', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'blogs' },
  { path: '/guide', title: 'Guides', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'guides' },
  { path: '/news', title: 'Newsroom', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'news' },
  { path: '/events', title: 'Events', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'events' },
  { path: '/webinars', title: 'Webinars', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'webinars' },
  { path: '/careers', title: 'Careers', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'jobs' },
  { path: '/case-studies', title: 'Case Studies', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'caseStudies' },
  { path: '/resource-center', title: 'Resource Center', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'resources' },
  { path: '/podcast', title: 'Podcast', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'podcastEpisodes' },
  { path: '/knowledge-hub', title: 'Knowledge Hub', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'knowledgeBase' },
  { path: '/legal', title: 'Legal', kind: 'cms-listing', schemaType: 'CollectionPage', backingCollection: 'legalDocuments' },

  // CMS detail templates — schema edited per-document; row deep-links the set.
  { path: '/blogs/[slug]', title: 'Blog post (template)', kind: 'cms-template', schemaType: 'BlogPosting', backingCollection: 'blogs' },
  { path: '/news/[slug]', title: 'News article (template)', kind: 'cms-template', schemaType: 'NewsArticle', backingCollection: 'news' },
  { path: '/guide/[slug]', title: 'Guide (template)', kind: 'cms-template', schemaType: 'Article', backingCollection: 'guides' },
  { path: '/resources/[slug]', title: 'Resource (template)', kind: 'cms-template', schemaType: 'Article', backingCollection: 'resources' },
  { path: '/knowledge-hub/[slug]', title: 'Knowledge article (template)', kind: 'cms-template', schemaType: 'Article', backingCollection: 'knowledgeBase' },
  { path: '/event/[slug]', title: 'Event (template)', kind: 'cms-template', schemaType: 'Event', backingCollection: 'events' },
  { path: '/job/[slug]', title: 'Job posting (template)', kind: 'cms-template', schemaType: 'JobPosting', backingCollection: 'jobs' },
  { path: '/author/[slug]', title: 'Author profile (template)', kind: 'cms-template', schemaType: 'ProfilePage', backingCollection: 'authors' },
  { path: '/legal/[slug]', title: 'Legal document (template)', kind: 'cms-template', schemaType: 'WebPage', backingCollection: 'legalDocuments' },
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
    if (!row.schemaType) {
      throw new Error(`pageRegistry seed: row needs schemaType: ${row.path}`);
    }
    if ((row.kind === 'cms-listing' || row.kind === 'cms-template') && !row.backingCollection) {
      throw new Error(`pageRegistry seed: ${row.kind} row needs backingCollection: ${row.path}`);
    }
  }
}
