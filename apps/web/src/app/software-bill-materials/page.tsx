import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { SbomHero } from "@/components/sections/sbom/SbomHero";
import { SbomRisks } from "@/components/sections/sbom/SbomRisks";
import { SbomSelfUpdating } from "@/components/sections/sbom/SbomSelfUpdating";
import { SbomIntelligence } from "@/components/sections/sbom/SbomIntelligence";
import { SbomAdvantage } from "@/components/sections/sbom/SbomAdvantage";
import { SbomCTA } from "@/components/sections/sbom/SbomCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "CleanStart SBOM | Complete, Verified, and Compliance-Ready",
  absoluteTitle: true,
  eyebrow: "Solutions",
  description:
    "Learn how CleanStart's SBOM Analyzer generates CISA compliant Software Bills of Materials for container images, mapping every component and dependency for full supply chain transparency.",
  path: "/software-bill-materials",
});

export default function SoftwareBillOfMaterialsPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="sbom-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Software Bill of Materials" },
        ])}
      />
      <Header />
      <main>
        <SbomHero />
        <FadeUp>
          <SbomRisks />
        </FadeUp>
        <FadeUp>
          <SbomSelfUpdating />
        </FadeUp>
        <FadeUp>
          <SbomIntelligence />
        </FadeUp>
        <FadeUp>
          <SbomAdvantage />
        </FadeUp>
      </main>
      <Footer cta={<SbomCTA />} />
    </>
  );
}
