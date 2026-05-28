import dynamic from "next/dynamic";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanSightHero } from "@/components/sections/cleansight/CleanSightHero";
import { CleanSightProblems } from "@/components/sections/cleansight/CleanSightProblems";
import { CleanSightBlindSpots } from "@/components/sections/cleansight/CleanSightBlindSpots";
import { CleanSightUnified } from "@/components/sections/cleansight/CleanSightUnified";
// CleanSightSecurity (~900L) and CleanSightComparison are the heaviest sections
// on this page (Pattern-11 desktop-absolute layouts). Code-split so they do
// not ship in the initial cleansight client bundle.
const CleanSightSecurity = dynamic(() =>
  import("@/components/sections/cleansight/CleanSightSecurity").then((m) => ({ default: m.CleanSightSecurity })),
);
const CleanSightComparison = dynamic(() =>
  import("@/components/sections/cleansight/CleanSightComparison").then((m) => ({ default: m.CleanSightComparison })),
);
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
