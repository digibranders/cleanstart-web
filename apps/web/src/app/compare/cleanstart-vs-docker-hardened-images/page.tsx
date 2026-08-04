import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/jsonld";
import { getPageGraph } from "@/lib/seo/compose-page";
import { CompareHero } from "@/components/sections/compare/CompareHero";
import { CompareIntro } from "@/components/sections/compare/CompareIntro";
import { CompareMatrix } from "@/components/sections/compare/CompareMatrix";
import { CompareSocialProof } from "@/components/sections/compare/CompareSocialProof";
import { ComparePhilosophies } from "@/components/sections/compare/ComparePhilosophies";
import { CompareBeyondCves } from "@/components/sections/compare/CompareBeyondCves";
import { CompareBuilds } from "@/components/sections/compare/CompareBuilds";
import { CompareProvenance } from "@/components/sections/compare/CompareProvenance";
import { CompareReadiness } from "@/components/sections/compare/CompareReadiness";
import { CompareChoose } from "@/components/sections/compare/CompareChoose";
import { CompareFAQ } from "@/components/sections/compare/CompareFAQ";
import { CompareCTA } from "@/components/sections/compare/CompareCTA";
import {
  COMPARE_FAQ_ITEMS,
  TITLE_MAIN,
} from "@/components/sections/compare/compare-data";

const PATH = "/compare/cleanstart-vs-docker-hardened-images";

export const metadata = buildPageMetadata({
  title: "Docker Hardened Images vs CleanStart | Full Comparison",
  absoluteTitle: true,
  description:
    "Compare Docker Hardened Images vs CleanStart across security, provenance, compliance, SBOMs, deterministic builds, and software verification.",
  path: PATH,
  eyebrow: "Comparison",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

/**
 * The source copy is a fourteen-section technical article, so the page is
 * typeset as long-form editorial: one continuous white reading column held by
 * hairline rules, one data artifact (the capability table), and one inverted
 * band where the article turns. `FadeUp` wraps the below-fold groups only — the
 * hero renders visible for LCP.
 */
export default async function CleanStartVsDockerHardenedImagesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph(PATH, [
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: TITLE_MAIN }]),
    faqPageSchema([...COMPARE_FAQ_ITEMS]),
  ]);

  return (
    <>
      <JsonLdGraph id="compare-dhi-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <CompareHero />
        <CompareIntro />
        <FadeUp>
          <CompareMatrix />
        </FadeUp>
        <FadeUp>
          <CompareSocialProof />
        </FadeUp>
        <FadeUp>
          <ComparePhilosophies />
        </FadeUp>
        <CompareBeyondCves />
        <CompareBuilds />
        <CompareProvenance />
        <CompareReadiness />
        <CompareChoose />
        <FadeUp>
          <CompareFAQ />
        </FadeUp>
      </main>
      <Footer cta={<CompareCTA />} />
    </>
  );
}
