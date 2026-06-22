import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { SCAHero } from "@/components/sections/sca/SCAHero";
import { SCAProblems } from "@/components/sections/sca/SCAProblems";
import { SCAReduceNoise } from "@/components/sections/sca/SCAReduceNoise";
import { SCATransform } from "@/components/sections/sca/SCATransform";
import { SCASecurityOutcomes } from "@/components/sections/sca/SCASecurityOutcomes";
import { SCABuiltForDev } from "@/components/sections/sca/SCABuiltForDev";
import { SCACTA } from "@/components/sections/sca/SCACTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph } from "@/lib/seo/compose-page";
import { getRegistryOverride } from "@/lib/page-registry";

export const metadata = buildPageMetadata({
  title: "Enhance SCA | CleanStart",
  absoluteTitle: true,
  description:
    "See how CleanStart enhances Software Composition Analysis by providing zero vulnerability base images that reduce false positives and accelerate remediation for SCA tools like Snyk and Checkmarx.",
  path: "/software-composition-analysis",
  eyebrow: "Solutions",
});

export const revalidate = 3600;

export default async function SCAPage(): Promise<React.ReactElement> {
  const schemaOverride = await getRegistryOverride("/software-composition-analysis");
  return (
    <>
      <JsonLdGraph
        id="sca-jsonld"
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Enhance SCA" },
            ]),
          ],
          override: schemaOverride,
        })}
      />
      <Header />
      <main id="main-content">
        <SCAHero />
        <FadeUp>
          <SCAProblems />
        </FadeUp>
        <FadeUp>
          <SCAReduceNoise />
        </FadeUp>
        <FadeUp>
          <SCATransform />
        </FadeUp>
        <FadeUp>
          <SCASecurityOutcomes />
        </FadeUp>
        <FadeUp>
          <SCABuiltForDev />
        </FadeUp>
      </main>
      <Footer cta={<SCACTA />} />
    </>
  );
}
