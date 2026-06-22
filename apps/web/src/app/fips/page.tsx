import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { FipsHero } from "@/components/sections/fips/FipsHero";
import { FipsWhyMatters } from "@/components/sections/fips/FipsWhyMatters";
import { FipsEnables } from "@/components/sections/fips/FipsEnables";
import { FipsMaturityModel } from "@/components/sections/fips/FipsMaturityModel";
import { FipsRegulatedEnvironments } from "@/components/sections/fips/FipsRegulatedEnvironments";
import { FipsOperationalImpact } from "@/components/sections/fips/FipsOperationalImpact";
import { FipsCTA } from "@/components/sections/fips/FipsCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph } from "@/lib/seo/compose-page";
import { getRegistryOverride } from "@/lib/page-registry";

export const metadata = buildPageMetadata({
  title: "FIPS-compliant hardened container images | CleanStart",
  absoluteTitle: true,
  description:
    "FIPS 140-3 validated cryptography built into hardened containers. Secure regulated workloads with automated compliance and continuous monitoring.",
  path: "/fips",
  eyebrow: "Solutions",
});

export const revalidate = 3600;

export default async function FipsCompliancePage(): Promise<React.ReactElement> {
  const schemaOverride = await getRegistryOverride("/fips");
  return (
    <>
      <JsonLdGraph
        id="fips-jsonld"
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "FIPS Compliance" },
            ]),
          ],
          override: schemaOverride,
        })}
      />
      <Header />
      <main id="main-content">
        <FipsHero />
        <FadeUp>
          <FipsWhyMatters />
        </FadeUp>
        <FadeUp>
          <FipsEnables />
        </FadeUp>
        <FadeUp>
          <FipsMaturityModel />
        </FadeUp>
        <FadeUp>
          <FipsRegulatedEnvironments />
        </FadeUp>
        <FadeUp>
          <FipsOperationalImpact />
        </FadeUp>
      </main>
      <Footer cta={<FipsCTA />} />
    </>
  );
}
