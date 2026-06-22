import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanSightHero } from "@/components/sections/cleansight/CleanSightHero";
import { CleanSightProblems } from "@/components/sections/cleansight/CleanSightProblems";
import { CleanSightRemediation } from "@/components/sections/cleansight/CleanSightRemediation";
import { CleanSightUnified } from "@/components/sections/cleansight/CleanSightUnified";
import { CleanSightStats } from "@/components/sections/cleansight/CleanSightStats";
import { CleanSightCTA } from "@/components/sections/cleansight/CleanSightCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Container Vulnerability Detection and Remediation | CleanSight",
  absoluteTitle: true,
  description:
    "Continuously discover software assets, inherited risk, and a remediation path. Move from blind spots to remediation.",
  path: "/cleansight",
  variant: "hero",
  eyebrow: "CleanSight",
  ogTitle: "Continuous Visibility. Continuous Remediation.",
  titleAccent: "Remediation.",
});

export const revalidate = 3600;

export default async function CleanSightPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/cleansight", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "CleanSight" },
    ]),
    softwareApplicationSchema({
      name: "CleanSight",
      description:
        "Continuously discover, assess, and remediate container risk across modern environments. Unified visibility with integrated remediation.",
      path: "/cleansight",
    }),
  ]);
  return (
    <>
      <JsonLdGraph id="cleansight-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <CleanSightHero />
        <FadeUp>
          <CleanSightProblems />
        </FadeUp>
        <FadeUp>
          <CleanSightRemediation />
        </FadeUp>
        <FadeUp>
          <CleanSightUnified />
        </FadeUp>
        <FadeUp>
          <CleanSightStats />
        </FadeUp>
      </main>
      <Footer cta={<CleanSightCTA />} />
    </>
  );
}
