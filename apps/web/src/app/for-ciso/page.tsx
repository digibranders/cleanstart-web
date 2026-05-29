import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CisoHero } from "@/components/sections/ciso/CisoHero";
import { CisoRisks } from "@/components/sections/ciso/CisoRisks";
import { CisoSolution } from "@/components/sections/ciso/CisoSolution";
import { CisoComparison } from "@/components/sections/ciso/CisoComparison";
import { CisoOutcomes } from "@/components/sections/ciso/CisoOutcomes";
import { CisoEnterprise } from "@/components/sections/ciso/CisoEnterprise";
import { CisoCTA } from "@/components/sections/ciso/CisoCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "For CISOs — Trusted Software Foundations",
  description:
    "Reduce inherited software risk with minimal, hardened, verifiable container foundations built for modern enterprise environments. Purpose-built for CISOs.",
  path: "/for-ciso",
});

export default function ForCisoPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="for-ciso-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "For CISOs" },
        ])}
      />
      <Header />
      <main>
        <CisoHero />
        <FadeUp>
          <CisoRisks />
        </FadeUp>
        <FadeUp>
          <CisoSolution />
        </FadeUp>
        <FadeUp>
          <CisoComparison />
        </FadeUp>
        <FadeUp>
          <CisoOutcomes />
        </FadeUp>
        <FadeUp>
          <CisoEnterprise />
        </FadeUp>
      </main>
      <Footer cta={<CisoCTA />} />
    </>
  );
}
