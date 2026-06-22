import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CisoHero } from "@/components/sections/ciso/CisoHero";
import { CisoRisks } from "@/components/sections/ciso/CisoRisks";
import { CisoLifecycle } from "@/components/sections/ciso/CisoLifecycle";
import { CisoEnterprise } from "@/components/sections/ciso/CisoEnterprise";
import { CisoValidationOutcomes } from "@/components/sections/ciso/CisoValidationOutcomes";
import { CisoCTA } from "@/components/sections/ciso/CisoCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Hardened Images & Libraries for Security and Compliance Teams | CleanStart",
  absoluteTitle: true,
  description:
    "Hardened images and libraries that help security and compliance teams cut inherited risk with continuous governance, provenance verification, and verified remediation.",
  path: "/for-ciso",
  eyebrow: "Solutions",
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
      <main id="main-content">
        <CisoHero />
        <FadeUp>
          <CisoRisks />
        </FadeUp>
        <FadeUp>
          <CisoLifecycle />
        </FadeUp>
        <FadeUp>
          <CisoEnterprise />
        </FadeUp>
        <FadeUp>
          <CisoValidationOutcomes />
        </FadeUp>
      </main>
      <Footer cta={<CisoCTA />} />
    </>
  );
}
