import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { PricingHero } from "@/components/sections/pricing/PricingHero";
import { PricingPlans } from "@/components/sections/pricing/PricingPlans";
import { PricingTiers } from "@/components/sections/pricing/PricingTiers";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Pricing | CleanStart",
  absoluteTitle: true,
  description:
    "Compare CleanStart plans: free hardened container images for developers, and enterprise images with FIPS validation and SLSA Level 3 provenance.",
  path: "/pricing",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function PricingPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/pricing", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Pricing" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="pricing-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <PricingHero />
        <FadeUp>
          <PricingPlans />
        </FadeUp>
        <FadeUp>
          <PricingTiers />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
