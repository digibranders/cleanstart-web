import dynamic from "next/dynamic";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanSightHero } from "@/components/sections/cleansight/CleanSightHero";
import { CleanSightProblems } from "@/components/sections/cleansight/CleanSightProblems";
import { CleanSightBlindSpots } from "@/components/sections/cleansight/CleanSightBlindSpots";
import { CleanSightUnified } from "@/components/sections/cleansight/CleanSightUnified";
// CleanSightSecurity and CleanSightComparison are the heaviest sections on this
// page; code-split so they stay out of the initial client bundle.
const CleanSightSecurity = dynamic(() =>
  import("@/components/sections/cleansight/CleanSightSecurity").then((m) => ({ default: m.CleanSightSecurity })),
);
const CleanSightComparison = dynamic(() =>
  import("@/components/sections/cleansight/CleanSightComparison").then((m) => ({ default: m.CleanSightComparison })),
);
import { CleanSightStats } from "@/components/sections/cleansight/CleanSightStats";
import { CleanSightCTA } from "@/components/sections/cleansight/CleanSightCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "CleanSight Container Visibility | SBOM, Risk Scoring, Compliance Mapping & Remediation Paths",
  absoluteTitle: true,
  description:
    "Discover CleanSight, CleanStart's container visibility tool that continuously discovers images across registries and Kubernetes clusters, maps vulnerabilities, and recommends hardened replacements.",
  path: "/cleansight",
  variant: "hero",
  eyebrow: "CleanSight",
  ogTitle: "Continuous Visibility. Continuous Remediation.",
  titleAccent: "Remediation.",
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
      <JsonLd
        id="cleansight-software"
        data={softwareApplicationSchema({
          name: "CleanSight",
          description:
            "Continuously discover, assess, and remediate container risk across modern environments. Unified visibility with integrated remediation.",
          path: "/cleansight",
        })}
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
