import type React from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { FinanceHero } from "@/components/sections/financial-services/FinanceHero";
import { FinanceStack } from "@/components/sections/financial-services/FinanceStack";
import { FinanceRiskChain } from "@/components/sections/financial-services/FinanceRiskChain";
import { FinanceFoundation } from "@/components/sections/financial-services/FinanceFoundation";
import { FinanceProofBand } from "@/components/sections/financial-services/FinanceProofBand";
import { FinanceCTA } from "@/components/sections/financial-services/FinanceCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";

/*
 * /financial-services — first draft.
 *
 * Unlinked and noindex on purpose: the page is not in nav-config, not in the
 * sitemap, and carries no JSON-LD graph yet. Drop the `noindex` flag, add the
 * breadcrumb/JsonLdGraph pair the other solutions pages use, and register the
 * route in nav-config + docs/web/WEB-PAGES.md when it is approved to ship.
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
        {/* The conformance record and the results share one continuous dark
            gradient, so the page closes on a single passage rather than two
            stacked bands. FinanceProofBand owns their FadeUps. */}
        <FinanceProofBand />
      </main>
      <Footer cta={<FinanceCTA />} />
    </>
  );
}
