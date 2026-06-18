import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ASRHero } from "@/components/sections/attack-surface-reduction/ASRHero";
import { ASRBloated } from "@/components/sections/attack-surface-reduction/ASRBloated";
import { ASRApproach } from "@/components/sections/attack-surface-reduction/ASRApproach";
import { ASRDelivers } from "@/components/sections/attack-surface-reduction/ASRDelivers";
import { ASRFits } from "@/components/sections/attack-surface-reduction/ASRFits";
import { ASRModern } from "@/components/sections/attack-surface-reduction/ASRModern";
import { ASRCTA } from "@/components/sections/attack-surface-reduction/ASRCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Reduce attack surface with Hardened Images | Cleanstart",
  absoluteTitle: true,
  description:
    "CleanStart shrinks your attack surface by stripping unnecessary components before production. Minimal, hardened images mean fewer inherited CVEs and less patching.",
  path: "/attack-surface-reduction",
  eyebrow: "Solutions",
});

export default function AttackSurfaceReductionPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="asr-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Attack Surface Reduction" },
        ])}
      />
      <Header />
      <main id="main-content">
        <ASRHero />
        {/* Wrapper owns the shared #F6F6F6 backdrop so ASRBloated + ASRApproach
            read as one continuous canvas with no visible seam between them. */}
        <div className="bg-[#F6F6F6]">
          <FadeUp>
            <ASRBloated />
          </FadeUp>
          <FadeUp>
            <ASRApproach />
          </FadeUp>
        </div>
        <FadeUp>
          <ASRDelivers />
        </FadeUp>
        <FadeUp>
          <ASRFits />
        </FadeUp>
        <FadeUp>
          <ASRModern />
        </FadeUp>
      </main>
      <Footer cta={<ASRCTA />} />
    </>
  );
}
