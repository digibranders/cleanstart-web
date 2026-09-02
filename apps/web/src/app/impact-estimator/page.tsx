import type React from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ImpactHero } from "@/components/sections/impact-estimator/ImpactHero";
import { ImpactSimulator } from "@/components/sections/impact-estimator/ImpactSimulator";
import { ImpactHowItWorks } from "@/components/sections/impact-estimator/ImpactHowItWorks";
import { ImpactCTA } from "@/components/sections/impact-estimator/ImpactCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Impact Estimator for Hardened Container Images | CleanStart",
  absoluteTitle: true,
  description:
    "Estimate the operational impact of moving to minimal, trusted container images: Vulnerability Noise Reduction, Patch Cycle Overhead Reduction, Faster Secure Releases, Runtime Footprint Reduction, and Engineering Hours Recovered.",
  path: "/impact-estimator",
  eyebrow: "Tools",
  // Not ready for search: kept out of the sitemap and nav (built: false), and
  // both noindex + nofollow'd here so crawlers that reach it directly neither
  // index it nor pass equity onward. Drop both (and add the route to sitemap
  // STATIC_ROUTES) when the page ships.
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback; on-demand publish revalidation keeps this fresh

export default async function ImpactEstimatorPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/impact-estimator", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Impact Estimator" },
    ]),
  ]);

  return (
    <>
      <JsonLdGraph id="impact-estimator-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <ImpactHero />
        <FadeUp>
          <ImpactSimulator />
        </FadeUp>
        <FadeUp>
          <ImpactHowItWorks />
        </FadeUp>
      </main>
      <Footer cta={<ImpactCTA />} />
    </>
  );
}
