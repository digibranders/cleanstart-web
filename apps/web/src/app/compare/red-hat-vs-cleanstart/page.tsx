import { buildPageMetadata } from "@/lib/seo/canonical";
import { ComparePage } from "@/components/sections/compare/ComparePage";
import { RED_HAT } from "@/components/sections/compare/compare-content-red-hat";

export const metadata = buildPageMetadata({
  title: RED_HAT.meta.title,
  absoluteTitle: true,
  description: RED_HAT.meta.description,
  path: RED_HAT.path,
  eyebrow: "Comparison",
});

export const revalidate = 21600; // 6h ISR fallback — matches the sibling comparison

/**
 * Red Hat Hardened Images vs CleanStart.
 *
 * Copy lives in `compare-content-red-hat.ts`; the composition is
 * `ComparePage`, shared with the Docker comparison, so the two pages read the
 * same way and only their content differs.
 *
 * The slug is SEO's rival-first wording under the `/compare/` segment the
 * user kept (2026-09-21). Both of this route's earlier paths
 * (`/compare/cleanstart-vs-red-hat-hardened-images` and top-level
 * `/red-hat-vs-cleanstart`) were pre-launch and never indexed, so no redirect
 * is owed for either.
 */
export default async function RedHatVsCleanStartPage(): Promise<React.ReactElement> {
  return <ComparePage content={RED_HAT} />;
}
