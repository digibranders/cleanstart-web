import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/jsonld";
import { getPageGraph } from "@/lib/seo/compose-page";
import { CompareHero } from "./CompareHero";
import { CompareFoundations } from "./CompareFoundations";
import { CompareMatrix } from "./CompareMatrix";
import { CompareBuildFlow } from "./CompareBuildFlow";
import { CompareDifferentiators } from "./CompareDifferentiators";
import { CompareFAQ } from "./CompareFAQ";
import { CompareCTA } from "./CompareCTA";
import type { CompareContent } from "./compare-types";

/**
 * The composition every `/compare/*` page renders. A route supplies its
 * `CompareContent` and its own `metadata`; everything below the metadata is
 * identical across comparisons by design, so the two pages cannot drift into
 * different reading experiences.
 *
 * Bands in the site's light/dark rhythm, one per heading in the source
 * document: hero (dark) → foundations (wash) → capability matrix (white) →
 * build flow (dark) → differentiators (lavender wash) → FAQ (white) → the
 * footer CTA card. The FAQ array feeds both the rendered accordion and the
 * FAQPage JSON-LD, so the two cannot drift either.
 *
 * `FadeUp` wraps the below-fold sections only — the hero renders visible so it
 * stays an LCP candidate.
 *
 * The breadcrumb is `Home > Compare > this page`. The middle crumb was held
 * back until `/compare` existed and was indexable (2026-09-22), because
 * pointing the live Docker page's BreadcrumbList at a `noindex` URL is worse
 * than a two-crumb trail.
 *
 * Only `/compare/cleanstart-vs-docker-hardened-images` has a `pageRegistry`
 * row, so the other routes get Organization and WebSite but no WebPage node.
 * The BreadcrumbList and FAQPage below are passed directly and are unaffected.
 */
export async function ComparePage({
  content,
}: {
  content: CompareContent;
}): Promise<React.ReactElement> {
  const graph = await getPageGraph(content.path, [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Compare", path: "/compare" },
      { name: content.title },
    ]),
    faqPageSchema([...content.faqs]),
  ]);

  return (
    <>
      <JsonLdGraph id="compare-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <CompareHero content={content} />
        <FadeUp>
          <CompareFoundations content={content.foundations} />
        </FadeUp>
        <FadeUp>
          <CompareMatrix
            matrix={content.matrix}
            vendor={content.vendor}
            rivalMark={content.rivalMark}
          />
        </FadeUp>
        <FadeUp>
          <CompareBuildFlow
            content={content.buildFlow}
            rivalMark={content.rivalMark}
            inheritedBase={content.inheritedBase}
          />
        </FadeUp>
        <FadeUp>
          <CompareDifferentiators content={content.differentiators} />
        </FadeUp>
        <FadeUp>
          <CompareFAQ heading={content.faqHeading} faqs={content.faqs} />
        </FadeUp>
      </main>
      <Footer cta={<CompareCTA content={content.cta} />} />
    </>
  );
}
