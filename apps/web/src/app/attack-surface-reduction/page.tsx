import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { AsrHero } from "@/components/sections/attack-surface-reduction/AsrHero";
import { AsrPublicImages } from "@/components/sections/attack-surface-reduction/AsrPublicImages";
import { AsrApproach } from "@/components/sections/attack-surface-reduction/AsrApproach";
import { AsrBusinessDelivers } from "@/components/sections/attack-surface-reduction/AsrBusinessDelivers";
import { AsrFitsBuilt } from "@/components/sections/attack-surface-reduction/AsrFitsBuilt";
import { AsrProductionEnv } from "@/components/sections/attack-surface-reduction/AsrProductionEnv";
import { AsrCTA } from "@/components/sections/attack-surface-reduction/AsrCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Attack Surface Reduction",
  description:
    "Bigger images mean bigger risk. CleanStart Images reduce attack surface by eliminating unnecessary components before they enter production.",
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
        <AsrHero />
        <FadeUp>
          <AsrPublicImages />
        </FadeUp>
        <FadeUp>
          <AsrApproach />
        </FadeUp>
        <FadeUp>
          <AsrBusinessDelivers />
        </FadeUp>
        <FadeUp>
          <AsrFitsBuilt />
        </FadeUp>
        <FadeUp>
          <AsrProductionEnv />
        </FadeUp>
      </main>
      <Footer cta={<AsrCTA />} />
    </>
  );
}
