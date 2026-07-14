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
    "Estimate the operational impact of moving to minimal, trusted container images — reduced vulnerability noise, lower patch-cycle overhead, faster secure releases, and engineering hours recovered.",
  path: "/roi-calculator",
  eyebrow: "Tools",
  // Not ready for search — kept out of the sitemap and nav (built: false), and
  // noindex'd here so crawlers that reach it directly don't index it. Drop this
  // (and add the route to sitemap STATIC_ROUTES) when the page ships.
  noindex: true,
});

export const revalidate = 3600;

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
