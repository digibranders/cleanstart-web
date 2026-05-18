import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanSightHero } from "@/components/sections/cleansight/CleanSightHero";
import { CleanSightProblems } from "@/components/sections/cleansight/CleanSightProblems";
import { CleanSightBlindSpots } from "@/components/sections/cleansight/CleanSightBlindSpots";
import { CleanSightUnified } from "@/components/sections/cleansight/CleanSightUnified";
import { CleanSightSecurity } from "@/components/sections/cleansight/CleanSightSecurity";
import { CleanSightComparison } from "@/components/sections/cleansight/CleanSightComparison";
import { CleanSightStats } from "@/components/sections/cleansight/CleanSightStats";
import { CleanSightCTA } from "@/components/sections/cleansight/CleanSightCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "CleanSight — Continuous Container Visibility & Remediation",
  description:
    "Continuously discover, assess, and remediate container risk across modern environments. CleanSight delivers unified visibility with integrated remediation.",
  path: "/cleansight",
});

export default function CleanSightPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="cleansight-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "CleanSight" },
        ])}
      />
      <Header />
      <main>
        <CleanSightHero />
        <FadeUp>
          <CleanSightProblems />
        </FadeUp>
        <FadeUp>
          <CleanSightBlindSpots />
        </FadeUp>
        <FadeUp>
          <CleanSightUnified />
        </FadeUp>
        <FadeUp>
          <CleanSightSecurity />
        </FadeUp>
        <FadeUp>
          <CleanSightComparison />
        </FadeUp>
        <FadeUp>
          <CleanSightStats />
        </FadeUp>
      </main>
      <Footer cta={<CleanSightCTA />} />
    </>
  );
}
