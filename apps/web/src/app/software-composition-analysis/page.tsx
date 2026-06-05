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
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Enhance SCA | CleanStart",
  absoluteTitle: true,
  description:
    "Eliminate dependency noise and improve accuracy with CleanStart's verified image foundations for SCA tools.",
  path: "/software-composition-analysis",
  eyebrow: "Solutions",
});

export default function SCAPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="sca-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Enhance SCA" },
        ])}
      />
      <Header />
      <main>
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
