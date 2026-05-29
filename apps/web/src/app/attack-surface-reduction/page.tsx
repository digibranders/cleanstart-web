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
  title: "Attack Surface Reduction",
  description:
    "CleanStart Images reduce attack surface by eliminating unnecessary components before they enter production.",
  path: "/attack-surface-reduction",
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
      <main>
        <ASRHero />
        {/*
         * ASRBloated + ASRApproach share a unified #F6F6F6 backdrop so the
         * two sections read as one continuous grey canvas with no visible
         * seam — both inner sections set their own bg transparent/F6F6F6,
         * and this wrapper acts as the single source of truth for the colour.
         */}
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
