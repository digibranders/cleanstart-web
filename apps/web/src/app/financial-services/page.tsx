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

/*
 * /financial-services — first draft.
 *
 * Unlinked and noindex,nofollow on purpose: the page is not in nav-config, not
 * in the sitemap, and carries no JSON-LD graph yet — reachable only by direct
 * URL. Drop the `noindex`/`nofollow` flags, add the breadcrumb/JsonLdGraph pair
 * the other solutions pages use, and register the route in nav-config +
 * docs/web/WEB-PAGES.md when it is approved to ship.
 */
export const metadata = buildPageMetadata({
  title:
    "Secure Software Foundations for Financial Institutions | CleanStart",
  absoluteTitle: true,
  description:
    "Verified container images and hardened open-source libraries for regulated financial software — SLSA Level 4 provenance, signed SBOMs, and FIPS 140-3 crypto.",
  path: "/financial-services",
  eyebrow: "Solutions",
  noindex: true,
  nofollow: true,
});

export default function FinancialServicesPage(): React.ReactElement {
  return (
    <>
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
