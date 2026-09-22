import { buildPageMetadata } from "@/lib/seo/canonical";
import { ComparePage } from "@/components/sections/compare/ComparePage";
import { CHAINGUARD } from "@/components/sections/compare/compare-content-chainguard";

export const metadata = buildPageMetadata({
  title: CHAINGUARD.meta.title,
  absoluteTitle: true,
  description: CHAINGUARD.meta.description,
  path: CHAINGUARD.path,
  eyebrow: "Comparison",
  // Held back from search until SEO signs the page off. Dropping this pair is
  // the launch step, together with adding the path to the sitemap's
  // STATIC_ROUTES — the Docker comparison went live the same way on
  // 2026-09-08.
  //
  // Slug: the `/compare/` segment is kept, with the rival-first wording from
  // SEO's metadata table inside it. The table itself writes the slug
  // top-level (`/chainguard-vs-cleanstart`); the segment is the user's
  // instruction of 2026-09-21 and wins. The Docker page keeps the older
  // `cleanstart-vs-…` order because it is indexed under it; moving it would be
  // a 301, not a rename.
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

/**
 * Chainguard vs CleanStart.
 *
 * Copy lives in `compare-content-chainguard.ts`; the composition is
 * `ComparePage`, shared with every other comparison.
 */
export default async function ChainguardVsCleanStartPage(): Promise<React.ReactElement> {
  return <ComparePage content={CHAINGUARD} />;
}
