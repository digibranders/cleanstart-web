import type React from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { FinanceHero } from "@/components/sections/financial-services/FinanceHero";
import { FinanceStack } from "@/components/sections/financial-services/FinanceStack";
import { FinanceRiskChain } from "@/components/sections/financial-services/FinanceRiskChain";
import { FinanceFoundation } from "@/components/sections/financial-services/FinanceFoundation";
import { FinanceRequirements } from "@/components/sections/financial-services/FinanceRequirements";
import { FinanceOutcomes } from "@/components/sections/financial-services/FinanceOutcomes";
import { FinanceCTA } from "@/components/sections/financial-services/FinanceCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

/*
 * /industries/financial-services
 *
 * Title, description and H1 are the SEO team's, applied verbatim.
 *
 * First page under the /industries segment, with software-applications (the
 * SaaS page) as its sibling. The segment is the one exception to this site's
 * otherwise flat routing (every other static page is a single segment,
 * including the /for-developers + /for-ciso role family) and it is deliberate:
 * two committed children and a named nav family, same reasoning as /compare.
 *
 * NOTE: /industries itself has no page.tsx and therefore 404s. A segment with
 * no hub is a dead end for anyone who truncates the URL, and it forfeits the
 * main SEO argument for nesting — a hub that ranks for the category term and
 * passes equity down. The breadcrumb is Home > this page for that reason; add
 * an Industries crumb only once the hub exists, or it links to a 404.
 *
 * Renamed twice. First from /financial-services while that URL was noindex,
 * unlinked and absent from the sitemap, so no ranking moved; a 301 for it sits
 * in the CMS `redirects` collection (id=41). Then, on request, from
 * /industries/financial-services-container-security to this shorter path AFTER
 * launch, which is the one rename that costs something: that URL was
 * indexable, sitemap-listed and nav-linked. Its 301 is in `next.config.ts`
 * rather than the CMS, so it ships with the code that moves the route. Two CMS
 * rows key on the old path and have to follow: the `pageRegistry` row (id=42),
 * without which this page's JSON-LD graph resolves to nothing, and the
 * redirects row (id=41), which would otherwise 301 into a 404.
 *
 * Launched: the noindex,nofollow pair is dropped and the path is listed in the
 * sitemap's STATIC_ROUTES. The breadcrumb, JsonLdGraph and pageRegistry row
 * were already in place. Its sibling /industries/software-applications stays
 * noindex,nofollow and unlisted, pending sign-off on its copy.
 */
export const metadata = buildPageMetadata({
  title: "Container Security for Financial Services | CleanStart",
  absoluteTitle: true,
  description:
    "Secure financial services workloads with hardened container images, near-zero CVEs, SBOMs, signed provenance, and continuous container security.",
  path: "/industries/financial-services",
  eyebrow: "Solutions",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function FinancialServicesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/industries/financial-services", [
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Financial Services" }]),
  ]);
  return (
    <>
      <JsonLdGraph id="financial-services-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <FinanceHero />
        <FadeUp>
          <FinanceStack />
        </FadeUp>
        <FadeUp>
          <FinanceRiskChain />
        </FadeUp>
        <FadeUp>
          <FinanceFoundation />
        </FadeUp>
        {/* Requirements stays light. The Footer is itself a dark gradient, so
            a dark Requirements would stack three dark blocks in a row before
            the page ends — every CTA page on this site runs exactly one dark
            section into the white CTA card and then the footer. The two light
            sections are separated by value instead. */}
        <FadeUp>
          <FinanceRequirements />
        </FadeUp>
        <FadeUp>
          <FinanceOutcomes />
        </FadeUp>
      </main>
      <Footer cta={<FinanceCTA />} />
    </>
  );
}
