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
 * /industries/financial-services-container-security
 *
 * Title, description and H1 are the SEO team's, applied verbatim.
 *
 * The only page under the /industries segment: the SEO doc put its sibling,
 * the SaaS page, at the top-level /modern-applications. The segment is an
 * exception to this site's otherwise flat routing (every other static page is
 * a single segment, including the /for-developers + /for-ciso role family);
 * it stays because the URL is the SEO team's and is live and indexed.
 *
 * NOTE: /industries itself has no page.tsx and therefore 404s. A segment with
 * no hub is a dead end for anyone who truncates the URL, and it forfeits the
 * main SEO argument for nesting — a hub that ranks for the category term and
 * passes equity down. The breadcrumb is Home > this page for that reason; add
 * an Industries crumb only once the hub exists, or it links to a 404.
 *
 * Renamed from /financial-services while that URL was still noindex, unlinked
 * and absent from the sitemap in production, so no ranking moved. A 301 from
 * the old path is registered in the CMS `redirects` collection anyway, since
 * it resolved publicly for a while and may sit in a bookmark or an inbox.
 *
 * Launched: the noindex,nofollow pair is dropped and the path is listed in the
 * sitemap's STATIC_ROUTES. The breadcrumb, JsonLdGraph and pageRegistry row
 * were already in place. Its sibling /modern-applications stays
 * noindex,nofollow and unlisted, pending sign-off on its copy.
 */
export const metadata = buildPageMetadata({
  title: "Container Security for Financial Services | CleanStart",
  absoluteTitle: true,
  description:
    "Secure financial services workloads with hardened container images, near-zero CVEs, SBOMs, signed provenance, and continuous container security.",
  path: "/industries/financial-services-container-security",
  eyebrow: "Solutions",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function FinancialServicesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/industries/financial-services-container-security", [
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Financial Services" }]),
  ]);
  return (
    <>
      <JsonLdGraph id="financial-services-container-security-jsonld" graph={graph} />
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
