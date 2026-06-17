import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { PricingHero } from "@/components/sections/pricing/PricingHero";
import { PricingPlans } from "@/components/sections/pricing/PricingPlans";
import { PricingTiers } from "@/components/sections/pricing/PricingTiers";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Pricing | CleanStart",
  absoluteTitle: true,
  description:
    "Choose the CleanStart plan that fits your team — free hardened container images for developers, enterprise images with FIPS and SLSA Level 3 provenance, plus custom images, clean libraries, and additional services.",
  path: "/pricing",
});

export default function PricingPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="pricing-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing" },
        ])}
      />
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
