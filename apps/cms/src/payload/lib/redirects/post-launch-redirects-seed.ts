import {
  assertRedirectSeedValid,
  type RedirectSeed,
} from '../webflow-import/redirects-seed';

/**
 * Post-launch 301 fixes found via a live Search Console API audit (2026-07-07):
 * two legacy URLs still earning search impressions but 404-ing, plus the
 * redirect for the just-deleted `/software-composition-analysis` orphan page
 * (kept `index,follow` and de-listed from nav/sitemap — Google was still
 * surfacing it in results, so the page was removed outright and this row
 * routes that equity to the live guide covering the same topic).
 *
 * Reuses the `RedirectSeed` type + invariant guard from the Phase H Webflow
 * seed — same shape, same validation — without conflating this ad-hoc batch
 * with that historical 26-row migration.
 */
export const POST_LAUNCH_REDIRECTS_SEED: readonly RedirectSeed[] = [
  {
    from: '/cleanstart-raksha-chennai',
    to: '/community',
    status: '301',
    note: 'GSC audit 2026-07-07: legacy Webflow event page, no equivalent route on the new site; remapped to /community.',
  },
  {
    from: '/webinar',
    to: '/webinars',
    status: '301',
    note: 'GSC audit 2026-07-07: legacy singular route still earning impressions; current listing is /webinars.',
  },
  {
    from: '/software-composition-analysis',
    to: '/guide/software-composition-analysis',
    status: '301',
    note: 'GSC audit 2026-07-07: orphaned marketing page (index,follow but absent from nav/sitemap) deleted outright; redirected to the equivalent live guide article.',
  },
];

export { assertRedirectSeedValid };
