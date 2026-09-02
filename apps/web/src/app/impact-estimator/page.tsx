import type React from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ImpactHero } from "@/components/sections/impact-estimator/ImpactHero";
import { ImpactSimulator } from "@/components/sections/impact-estimator/ImpactSimulator";
import { ImpactHowItWorks } from "@/components/sections/impact-estimator/ImpactHowItWorks";
import { ImpactFAQ } from "@/components/sections/impact-estimator/ImpactFAQ";
import { ImpactCTA } from "@/components/sections/impact-estimator/ImpactCTA";
import { FAQS } from "@/components/sections/impact-estimator/impact-content";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Impact Estimator for Hardened Container Images | CleanStart",
  absoluteTitle: true,
  description:
    "Estimate what hardened container images change for your runtime: vulnerability noise, patch cycles, release speed, footprint, and engineering hours recovered.",
  path: "/impact-estimator",
  eyebrow: "Tools",
});

export const revalidate = 21600; // 6h ISR fallback; on-demand publish revalidation keeps this fresh

export default async function ImpactEstimatorPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/impact-estimator", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Impact Estimator" },
    ]),
    faqPageSchema([...FAQS]),
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
        <FadeUp>
          <ImpactFAQ />
        </FadeUp>
      </main>
      <Footer cta={<ImpactCTA />} />
    </>
  );
}
