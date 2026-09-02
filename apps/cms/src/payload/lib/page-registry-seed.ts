/**
 * Canonical list of every apps/web route, seeded into the `pageRegistry`
 * collection so the Pages (Schema) list can show every page — including the
 * hardcoded static pages that have no content document.
 *
 * Source of truth: docs/web/WEB-PAGES.md + apps/web/src/lib/nav-config.ts.
 * Keep in sync when a page is added/removed/renamed.
 *
 * `order` follows the live-site mega-menu sequence (Home → Products → Solutions
 * → Resources → Company → Partners → Pricing), then off-nav static pages, then
 * listing index pages, then detail templates — so the list reads the way the
 * site nav does. The collection default-sorts by it.
 *
 * `kind`:
 *  - static       → hardcoded React page (no CMS doc). Owns its schema here.
 *  - cms-listing  → a collection's index page (also no per-page doc).
 *  - cms-template → a dynamic detail route ([slug]); schema is edited on each
 *                   document, this row just deep-links into the collection.
 */

export type PageKind = 'static' | 'cms-listing' | 'cms-template';

/** Functional WebPage @type auto-emitted by the web build for this route. */
export type WebPageTypeSeed =
  | 'WebPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'CollectionPage'
  | 'ProfilePage';

export interface PageRegistrySeedRow {
  path: string;
  title: string;
  kind: PageKind;
  order: number;
  backingCollection?: string;
  /**
   * Initial functional WebPage @type. Only the composed-graph STATIC routes
   * (those that call getPageGraph in apps/web) emit it today; listing pages
   * still use the legacy multi-script JSON-LD and ignore it until converted.
   * Omit → 'none' (no WebPage node). Editors can change it per row afterwards.
   */
  webPageType?: WebPageTypeSeed;
}

export const PAGE_REGISTRY_SEED: readonly PageRegistrySeedRow[] = [
  // Home
  { path: '/', title: 'Home', kind: 'static', order: 0, webPageType: 'WebPage' },

  // Products (mega-menu)
  { path: '/cleanstart-images', title: 'CleanStart Images', kind: 'static', order: 1, webPageType: 'WebPage' },
  { path: '/clean-libraries', title: 'Clean Libraries', kind: 'static', order: 2, webPageType: 'WebPage' },
  { path: '/cleansight', title: 'CleanSight', kind: 'static', order: 3, webPageType: 'WebPage' },

  // Solutions (mega-menu)
  { path: '/vulnerability-remediation', title: 'Vulnerability Remediation', kind: 'static', order: 4, webPageType: 'WebPage' },
  { path: '/attack-surface-reduction', title: 'Attack Surface Reduction', kind: 'static', order: 5, webPageType: 'WebPage' },
  { path: '/fips', title: 'FIPS Compliance', kind: 'static', order: 6, webPageType: 'WebPage' },
  { path: '/software-bill-materials', title: 'Software Bill of Materials', kind: 'static', order: 7, webPageType: 'WebPage' },
  { path: '/for-developers', title: 'For Developers', kind: 'static', order: 8, webPageType: 'WebPage' },
  { path: '/for-ciso', title: 'For CISO', kind: 'static', order: 9, webPageType: 'WebPage' },
  // Solutions › Capability tool. Order sits after every seeded row so existing
  // dashboard positions keep their numbers.
  { path: '/impact-estimator', title: 'Impact Estimator', kind: 'static', order: 49, webPageType: 'WebPage' },

  // Resources (mega-menu)
  { path: '/blogs', title: 'Blogs', kind: 'cms-listing', order: 10, backingCollection: 'blogs' },
  { path: '/guide', title: 'Guides', kind: 'cms-listing', order: 11, backingCollection: 'guides' },
  { path: '/resource-center', title: 'Resource Center', kind: 'cms-listing', order: 12, backingCollection: 'resources' },
  { path: '/case-studies', title: 'Case Studies', kind: 'cms-listing', order: 13, backingCollection: 'caseStudies' },
  { path: '/news', title: 'Newsroom', kind: 'cms-listing', order: 14, backingCollection: 'news' },
  { path: '/knowledge-hub', title: 'Knowledge Hub', kind: 'cms-listing', order: 15, backingCollection: 'knowledgeBase' },
  { path: '/events', title: 'Events', kind: 'cms-listing', order: 16, backingCollection: 'events' },
  { path: '/webinars', title: 'Webinars', kind: 'cms-listing', order: 17, backingCollection: 'webinars' },
  { path: '/podcast', title: 'Podcast', kind: 'cms-listing', order: 18, backingCollection: 'podcastEpisodes' },

  // Company (mega-menu)
  { path: '/about-us', title: 'About Us', kind: 'static', order: 19, webPageType: 'AboutPage' },
  { path: '/teams', title: 'Teams', kind: 'static', order: 20, webPageType: 'AboutPage' },
  { path: '/community', title: 'Community', kind: 'static', order: 21, webPageType: 'WebPage' },
  { path: '/careers', title: 'Careers', kind: 'cms-listing', order: 22, backingCollection: 'jobs' },
  { path: '/contact-us', title: 'Contact Us', kind: 'static', order: 23, webPageType: 'ContactPage' },

  // Flat nav items
  { path: '/partners', title: 'Partners', kind: 'static', order: 24, webPageType: 'WebPage' },
  { path: '/pricing', title: 'Pricing', kind: 'static', order: 25, webPageType: 'WebPage' },

  // Off-nav static pages
  { path: '/cleanstart-platform', title: 'CleanStart Platform', kind: 'static', order: 26, webPageType: 'WebPage' },
  { path: '/software-composition-analysis', title: 'Software Composition Analysis', kind: 'static', order: 27, webPageType: 'WebPage' },
  { path: '/book-a-demo', title: 'Book a Demo', kind: 'static', order: 28, webPageType: 'ContactPage' },
  { path: '/deal-registration', title: 'Deal Registration', kind: 'static', order: 29, webPageType: 'ContactPage' },
  { path: '/privacy-policy', title: 'Privacy Policy', kind: 'static', order: 30, webPageType: 'WebPage' },
  { path: '/legal', title: 'Legal', kind: 'cms-listing', order: 31, backingCollection: 'legalDocuments' },

  // CMS detail templates — schema edited per-document; row deep-links the set.
  { path: '/blogs/[slug]', title: 'Blog post (template)', kind: 'cms-template', order: 40, backingCollection: 'blogs' },
  { path: '/news/[slug]', title: 'News article (template)', kind: 'cms-template', order: 41, backingCollection: 'news' },
  { path: '/guide/[slug]', title: 'Guide (template)', kind: 'cms-template', order: 42, backingCollection: 'guides' },
  { path: '/resources/[slug]', title: 'Resource (template)', kind: 'cms-template', order: 43, backingCollection: 'resources' },
  { path: '/knowledge-hub/[slug]', title: 'Knowledge article (template)', kind: 'cms-template', order: 44, backingCollection: 'knowledgeBase' },
  { path: '/event/[slug]', title: 'Event (template)', kind: 'cms-template', order: 45, backingCollection: 'events' },
  { path: '/job/[slug]', title: 'Job posting (template)', kind: 'cms-template', order: 46, backingCollection: 'jobs' },
  { path: '/author/[slug]', title: 'Author profile (template)', kind: 'cms-template', order: 47, backingCollection: 'authors' },
  { path: '/legal/[slug]', title: 'Legal document (template)', kind: 'cms-template', order: 48, backingCollection: 'legalDocuments' },
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
