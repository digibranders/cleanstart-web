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
 * /financial-services — live.
 *
 * Indexable as of the client sign-off: the `noindex`/`nofollow` flags are gone,
 * the route is in the sitemap's STATIC_ROUTES and in nav-config under
 * Solutions › By industry, and it carries the breadcrumb + JsonLdGraph pair
 * every other solutions page uses. /saas is the sibling page and stays
 * noindex until its own copy is approved.
 */
export const metadata = buildPageMetadata({
  title:
    "Secure Software Foundations for Financial Institutions | CleanStart",
  absoluteTitle: true,
  description:
    "Verified container images and hardened open-source libraries for regulated financial software: SLSA Level 3 provenance, signed SBOMs, and FIPS 140-3 crypto.",
  path: "/financial-services",
  eyebrow: "Solutions",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function FinancialServicesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/financial-services", [
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
