import { isValidExternalLink } from '../url-shape';

/**
 * The legacy Webflow → new-site 301 redirect map (Phase H migration).
 *
 * Source of truth: `migrations/webflow-export/redirects-final.json` (26 rows).
 * Embedded here as a typed const so the seed script is self-contained — the
 * prod CMS container does not carry the `migrations/` tree.
 *
 * Targets were validated against the live route set at authoring time:
 *  - 21 point at a live static route or an external URL (verbatim).
 *  - 1 points at a CMS blog slug (`/blogs/busybox-container-security-risk`) —
 *    seeded verbatim; spot-check the blog is published or the 301 lands on a 404.
 *  - 4 Webflow targets no longer exist on the new site and were **remapped** to
 *    the nearest live page so the 301 passes equity instead of 404-ing
 *    (`originalTarget` + `note` preserve the provenance for review in the admin).
 */
export interface RedirectSeed {
  /** Old Webflow source path. Unique. */
  readonly from: string;
  /** Destination — a live site-relative path or a full https URL. */
  readonly to: string;
  readonly status: '301';
  /** The original Webflow destination, when `to` was remapped to a live page. */
  readonly originalTarget?: string;
  /** Provenance / remap reason / verify flag — written to the Redirect `notes`. */
  readonly note?: string;
}

const WEBFLOW = 'Webflow migration import (Phase H).';

export const REDIRECTS_SEED: readonly RedirectSeed[] = [
  // ── Live static-route targets (verbatim) ───────────────────────────────
  { from: '/about', to: '/about-us', status: '301', note: WEBFLOW },
  { from: '/about-us-copy', to: '/teams', status: '301', note: WEBFLOW },
  { from: '/attack-surface', to: '/attack-surface-reduction', status: '301', note: WEBFLOW },
  { from: '/cso-page', to: '/for-ciso', status: '301', note: WEBFLOW },
  { from: '/for-cso', to: '/for-ciso', status: '301', note: WEBFLOW },
  { from: '/deal-reg', to: '/deal-registration', status: '301', note: WEBFLOW },
  { from: '/event', to: '/events', status: '301', note: WEBFLOW },
  { from: '/fips-dekstop', to: '/fips', status: '301', note: WEBFLOW },
  { from: '/fips-old', to: '/fips', status: '301', note: WEBFLOW },
  { from: '/for-devlopers', to: '/for-developers', status: '301', note: WEBFLOW },
  { from: '/how-it-works', to: '/cleanstart-images', status: '301', note: WEBFLOW },
  { from: '/jobs', to: '/careers', status: '301', note: WEBFLOW },
  { from: '/knowledge-hub-new', to: '/knowledge-hub', status: '301', note: WEBFLOW },
  { from: '/knowledge-hub-old', to: '/knowledge-hub', status: '301', note: WEBFLOW },
  { from: '/partnership', to: '/partners', status: '301', note: WEBFLOW },
  { from: '/podcast-series', to: '/podcast', status: '301', note: WEBFLOW },
  { from: '/resources', to: '/resource-center', status: '301', note: WEBFLOW },
  { from: '/vulnerability', to: '/vulnerability-remediation', status: '301', note: WEBFLOW },

  // ── External targets (verbatim — old event pages → homepage) ───────────
  { from: '/connecting-learning-celebrating', to: 'https://www.cleanstart.com', status: '301', note: WEBFLOW },
  { from: '/connecting-learning-celebrating-eventus', to: 'https://www.cleanstart.com', status: '301', note: WEBFLOW },
  { from: '/connecting-learning-celebrating-sysdig', to: 'https://www.cleanstart.com', status: '301', note: WEBFLOW },

  // ── CMS blog slug (verbatim — verify the blog is published) ────────────
  {
    from: '/blogs/the-hidden-risk-inside-most-container-images-why-busybox-still-ships-in-production',
    to: '/blogs/busybox-container-security-risk',
    status: '301',
    note: `${WEBFLOW} Target is a CMS blog slug — confirm it is published, else this 301s to a 404.`,
  },

  // ── Remapped: Webflow target no longer exists on the new site ──────────
  {
    from: '/cleansight-campaign',
    to: '/cleansight',
    status: '301',
    originalTarget: '/cleansight-demo-request',
    note: `${WEBFLOW} Webflow target /cleansight-demo-request has no equivalent route; remapped to the CleanSight product page.`,
  },
  {
    from: '/cleanstart-hitachi',
    to: '/community',
    status: '301',
    originalTarget: '/cleanstart-hitachi-chennai',
    note: `${WEBFLOW} Webflow event page /cleanstart-hitachi-chennai has no equivalent route; remapped to /community (Hitachi is a community partner).`,
  },
  {
    from: '/cleanstart-survey',
    to: '/community',
    status: '301',
    originalTarget: '/cleanstart-hitachi-chennai',
    note: `${WEBFLOW} Webflow event page /cleanstart-hitachi-chennai has no equivalent route; remapped to /community.`,
  },
  {
    from: '/new-year-event',
    to: '/events',
    status: '301',
    originalTarget: '/new-year-event-sysdig',
    note: `${WEBFLOW} Webflow event page /new-year-event-sysdig has no equivalent route; remapped to the /events listing.`,
  },
];

/**
 * Fail-fast invariant guard run by the seed script before it touches the DB.
 * Throws on malformed seed data (duplicate `from`, bad path/URL shape, or a
 * non-301 status) so a data-entry slip can never write a broken redirect.
 */
export function assertRedirectSeedValid(seed: readonly RedirectSeed[] = REDIRECTS_SEED): void {
  const seen = new Set<string>();
  for (const r of seed) {
    if (seen.has(r.from)) {
      throw new Error(`Duplicate redirect 'from': ${r.from}`);
    }
    seen.add(r.from);
    if (!isValidExternalLink(r.from)) {
      throw new Error(`Invalid redirect 'from' (must be /path or https URL): ${r.from}`);
    }
    if (!isValidExternalLink(r.to)) {
      throw new Error(`Invalid redirect 'to' (must be /path or https URL): ${r.to}`);
    }
    if (r.status !== '301') {
      throw new Error(`Redirect ${r.from} has non-301 status: ${r.status}`);
    }
  }
}
