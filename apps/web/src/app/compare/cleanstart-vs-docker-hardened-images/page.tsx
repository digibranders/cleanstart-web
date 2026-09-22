import { buildPageMetadata } from "@/lib/seo/canonical";
import { ComparePage } from "@/components/sections/compare/ComparePage";
import { DHI } from "@/components/sections/compare/compare-content-dhi";

export const metadata = buildPageMetadata({
  title: DHI.meta.title,
  absoluteTitle: true,
  description: DHI.meta.description,
  path: DHI.path,
  eyebrow: "Comparison",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

/**
 * Docker Hardened Images vs CleanStart.
 *
 * Copy lives in `compare-content-dhi.ts`; the composition is `ComparePage`,
 * shared with every other comparison.
 *
 * Launched 2026-09-08: the `noindex, nofollow` pair is dropped and the path is
 * listed in the sitemap's STATIC_ROUTES.
 */
export default async function CleanStartVsDockerHardenedImagesPage(): Promise<React.ReactElement> {
  return <ComparePage content={DHI} />;
}
