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
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph } from "@/lib/seo/compose-page";
import { getRegistryOverride } from "@/lib/page-registry";

export const metadata = buildPageMetadata({
  title: "CleanStart SBOM for software transparency | CleanStart",
  absoluteTitle: true,
  eyebrow: "Solutions",
  description:
    "CleanStart images deliver automated SBOM generation with cryptographic signing and continuous software integrity tracking across build and delivery workflows.",
  path: "/software-bill-materials",
});

export const revalidate = 3600;

export default async function SoftwareBillOfMaterialsPage(): Promise<React.ReactElement> {
  const schemaOverride = await getRegistryOverride("/software-bill-materials");
  return (
    <>
      <JsonLdGraph
        id="sbom-jsonld"
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Software Bill of Materials" },
            ]),
          ],
          override: schemaOverride,
        })}
      />
      <Header />
      <main id="main-content">
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
