import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { TricorderHero } from "@/components/sections/tricorder/TricorderHero";
import { TricorderThreatGap } from "@/components/sections/tricorder/TricorderThreatGap";
import { TricorderContext } from "@/components/sections/tricorder/TricorderContext";
import { TricorderPipeline } from "@/components/sections/tricorder/TricorderPipeline";
import { TricorderSubstrate } from "@/components/sections/tricorder/TricorderSubstrate";
import { TricorderCTA } from "@/components/sections/tricorder/TricorderCTA";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

// The SERP snippet leads with what the page is searched for; the OG card below
// keeps the brand line. They are different surfaces and should not be the same
// sentence.
const DESCRIPTION =
  "Tricorder finds malicious and tampered components that pass CVE scans. Behavioral analysis, package history, and threat intelligence resolve to one verdict.";

/** Longer than the meta description: schema has no snippet-length budget. */
const SCHEMA_DESCRIPTION =
  "Tricorder is the intelligence layer behind CleanStart. It analyzes what a component can do, compares it against its own release history, correlates it with shared maintainers and infrastructure, and enriches it with threat intelligence to produce an evidence-backed verdict on every software component.";

/** The hub cube is the page's own artwork, so it is what Google should thumbnail. */
const PRIMARY_IMAGE = "/images/tricorder/hub-intelligence-cube.webp";

export const metadata = buildPageMetadata({
  title: "Malicious Package Detection | Tricorder by CleanStart",
  absoluteTitle: true,
  description: DESCRIPTION,
  path: "/tricorder",
  variant: "hero",
  eyebrow: "Products",
  ogTitle: "The Intelligence Layer for Software Trust",
  titleAccent: "Software Trust",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function TricorderPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph(
    "/tricorder",
    [
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Tricorder" },
      ]),
      softwareApplicationSchema({
        name: "Tricorder",
        description: SCHEMA_DESCRIPTION,
        path: "/tricorder",
        imageUrl: absoluteUrl(PRIMARY_IMAGE),
      }),
    ],
    { primaryImagePath: PRIMARY_IMAGE },
  );
  return (
    <>
      <JsonLdGraph id="tricorder-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <TricorderHero />
        <FadeUp>
          <TricorderThreatGap />
        </FadeUp>
        <FadeUp>
          <TricorderContext />
        </FadeUp>
        <FadeUp>
          <TricorderPipeline />
        </FadeUp>
        <FadeUp>
          <TricorderSubstrate />
        </FadeUp>
      </main>
      <Footer cta={<TricorderCTA />} />
    </>
  );
}
