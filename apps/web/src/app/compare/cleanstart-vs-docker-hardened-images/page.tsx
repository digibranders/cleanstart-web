import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/jsonld";
import { getPageGraph } from "@/lib/seo/compose-page";
import { CompareHero } from "@/components/sections/compare/CompareHero";
import { CompareFoundations } from "@/components/sections/compare/CompareFoundations";
import { CompareMatrix } from "@/components/sections/compare/CompareMatrix";
import { CompareBuildFlow } from "@/components/sections/compare/CompareBuildFlow";
import { CompareDifferentiators } from "@/components/sections/compare/CompareDifferentiators";
import { CompareFAQ } from "@/components/sections/compare/CompareFAQ";
import { CompareCTA } from "@/components/sections/compare/CompareCTA";
import { FAQS, META, PATH, TITLE } from "@/components/sections/compare/compare-data";

export const metadata = buildPageMetadata({
  title: META.title,
  absoluteTitle: true,
  description: META.description,
  path: PATH,
  eyebrow: "Comparison",
  /*
   * Held back from search until the page is signed off. Both directives are
   * deliberate: `nofollow` is not the default for a per-page `noindex` (the
   * helper still emits `follow` so link equity flows), so it is set explicitly
   * here. Drop BOTH of these and re-add the path to `app/sitemap.ts` when the
   * page ships — the sitemap entry stays removed for as long as this is
   * noindex, because listing a noindex URL is a contradictory signal.
   */
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

/**
 * Docker Hardened Images vs CleanStart.
 *
 * Five bands, one per heading in the source document, in the site's
 * light/dark rhythm: hero (dark) → foundations (wash) → capability matrix
 * (white) → build flow (dark) → differentiators (wash) → FAQ (white) → the
 * footer CTA card. Every string is in `compare-data.ts`; the FAQ feeds both
 * the rendered accordion and the FAQPage JSON-LD from the same array, so the
 * two cannot drift.
 *
 * `FadeUp` wraps the below-fold sections only — the hero renders visible so it
 * stays an LCP candidate.
 */
export default async function CleanStartVsDockerHardenedImagesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph(PATH, [
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: TITLE }]),
    faqPageSchema([...FAQS]),
  ]);

  return (
    <>
      <JsonLdGraph id="compare-dhi-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <CompareHero />
        <FadeUp>
          <CompareFoundations />
        </FadeUp>
        <FadeUp>
          <CompareMatrix />
        </FadeUp>
        <FadeUp>
          <CompareBuildFlow />
        </FadeUp>
        <FadeUp>
          <CompareDifferentiators />
        </FadeUp>
        <FadeUp>
          <CompareFAQ />
        </FadeUp>
      </main>
      <Footer cta={<CompareCTA />} />
    </>
  );
}
