import { Header } from "@/components/sections/Header";
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
        <FadeUp>
          <ASRBloated />
        </FadeUp>
        <FadeUp>
          <ASRApproach />
        </FadeUp>
        <FadeUp>
          <ASRDelivers />
        </FadeUp>
        <FadeUp>
          <ASRFits />
        </FadeUp>
        <FadeUp>
          <ASRModern />
        </FadeUp>
        <FadeUp>
          <ASRCTA />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
