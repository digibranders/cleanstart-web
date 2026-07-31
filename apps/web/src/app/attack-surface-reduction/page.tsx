import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ASRHero } from "@/components/sections/attack-surface-reduction/ASRHero";
import { ASRBloated } from "@/components/sections/attack-surface-reduction/ASRBloated";
import { ASRApproach } from "@/components/sections/attack-surface-reduction/ASRApproach";
import { ASRFits } from "@/components/sections/attack-surface-reduction/ASRFits";
import { ASRModern } from "@/components/sections/attack-surface-reduction/ASRModern";
import { ASRCTA } from "@/components/sections/attack-surface-reduction/ASRCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Reduce attack surface with Hardened Images | CleanStart",
  absoluteTitle: true,
  description:
    "CleanStart shrinks your attack surface by stripping unnecessary components before production. Minimal, hardened images mean fewer inherited CVEs and less patching.",
  path: "/attack-surface-reduction",
  eyebrow: "Solutions",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function AttackSurfaceReductionPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/attack-surface-reduction", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Attack Surface Reduction" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="asr-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <ASRHero />
        {/* #F6F6F6 backdrop for ASRBloated's light composition. */}
        <div className="bg-[#F6F6F6]">
          <FadeUp>
            <ASRBloated />
          </FadeUp>
        </div>
        {/* ASRApproach is a dark band (theme="dark") — breaks the light run. */}
        <FadeUp>
          <ASRApproach />
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
