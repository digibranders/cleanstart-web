import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { FipsHero } from "@/components/sections/fips/FipsHero";
import { FipsWhyMatters } from "@/components/sections/fips/FipsWhyMatters";
import { FipsRegulatedEnvironments } from "@/components/sections/fips/FipsRegulatedEnvironments";
import { FipsHowDelivers } from "@/components/sections/fips/FipsHowDelivers";
import { FipsTrustedIndustries } from "@/components/sections/fips/FipsTrustedIndustries";
import { FipsCTA } from "@/components/sections/fips/FipsCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

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
  const graph = await getPageGraph("/fips", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "FIPS Compliance" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="fips-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <FipsHero />
        <FadeUp>
          <FipsWhyMatters />
        </FadeUp>
        <FadeUp>
          <FipsRegulatedEnvironments />
        </FadeUp>
        <FadeUp>
          <FipsHowDelivers />
        </FadeUp>
        <FadeUp>
          <FipsTrustedIndustries />
        </FadeUp>
      </main>
      <Footer cta={<FipsCTA />} />
    </>
  );
}
