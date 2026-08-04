import type React from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { RoiHero } from "@/components/sections/roi-calculator/RoiHero";
import { RoiSimulator } from "@/components/sections/roi-calculator/RoiSimulator";
import { RoiHowItWorks } from "@/components/sections/roi-calculator/RoiHowItWorks";
import { RoiCTA } from "@/components/sections/roi-calculator/RoiCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "ROI Calculator — Operational Impact of Hardened Images | CleanStart",
  absoluteTitle: true,
  description:
    "Estimate the operational impact of moving to minimal, trusted container images — Vulnerability Noise Reduction, Patch Cycle Overhead Reduction, Faster Secure Releases, Runtime Footprint Reduction, and Engineering Hours Recovered.",
  path: "/roi-calculator",
  eyebrow: "Tools",
  // Not ready for search — kept out of the sitemap and nav (built: false), and
  // both noindex + nofollow'd here so crawlers that reach it directly neither
  // index it nor pass equity onward. Drop both (and add the route to sitemap
  // STATIC_ROUTES) when the page ships.
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function RoiCalculatorPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/roi-calculator", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "ROI Calculator" },
    ]),
  ]);

  return (
    <>
      <JsonLdGraph id="roi-calculator-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <RoiHero />
        <FadeUp>
          <RoiSimulator />
        </FadeUp>
        <FadeUp>
          <RoiHowItWorks />
        </FadeUp>
      </main>
      <Footer cta={<RoiCTA />} />
    </>
  );
}
