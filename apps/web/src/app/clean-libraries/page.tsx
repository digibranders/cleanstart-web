import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { LibrariesHero } from "@/components/sections/clean-libraries/LibrariesHero";
import { LibrariesPipeline } from "@/components/sections/clean-libraries/LibrariesPipeline";
import { LibrariesTrustGap } from "@/components/sections/clean-libraries/LibrariesTrustGap";
import { LibrariesEstablishTrust } from "@/components/sections/clean-libraries/LibrariesEstablishTrust";
import { LibrariesGovernance } from "@/components/sections/clean-libraries/LibrariesGovernance";
import { LibrariesWorkflow } from "@/components/sections/clean-libraries/LibrariesWorkflow";
import { LibrariesCTA } from "@/components/sections/clean-libraries/LibrariesCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Clean Libraries: Verify Every Dependency Across Your Workflow",
  absoluteTitle: true,
  description:
    "Scan every library for vulnerabilities and provenance, catch dependencies AI tools add silently, and gate builds with signed verdicts across your entire workflow.",
  path: "/clean-libraries",
  variant: "hero",
  eyebrow: "Products",
});

export const revalidate = 3600;

export default async function CleanLibrariesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/clean-libraries", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Clean Libraries" },
    ]),
    softwareApplicationSchema({
      name: "Clean Libraries",
      description:
        "Discover, validate, and govern every software dependency — including AI-introduced libraries — across the development lifecycle, with policy enforcement built into existing CI/CD and registries.",
      path: "/clean-libraries",
    }),
  ]);
  return (
    <>
      <JsonLdGraph id="clean-libraries-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <LibrariesHero />
        <FadeUp>
          <LibrariesPipeline />
        </FadeUp>
        <FadeUp>
          <LibrariesTrustGap />
        </FadeUp>
        <FadeUp>
          <LibrariesEstablishTrust />
        </FadeUp>
        <FadeUp>
          <LibrariesGovernance />
        </FadeUp>
        <FadeUp>
          <LibrariesWorkflow />
        </FadeUp>
      </main>
      <Footer cta={<LibrariesCTA />} />
    </>
  );
}
