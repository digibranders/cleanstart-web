import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { TricorderHero } from "@/components/sections/tricorder/TricorderHero";
import { TricorderThreatGap } from "@/components/sections/tricorder/TricorderThreatGap";
import { TricorderContext } from "@/components/sections/tricorder/TricorderContext";
import { TricorderPipeline } from "@/components/sections/tricorder/TricorderPipeline";
import { TricorderSubstrate } from "@/components/sections/tricorder/TricorderSubstrate";
import { TricorderCTA } from "@/components/sections/tricorder/TricorderCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

const DESCRIPTION =
  "Tricorder analyzes, compares, correlates, and enriches every software component to produce an evidence-backed verdict before you trust it.";

// On hold pending sign-off on the redesign: noindex,nofollow and left out of
// the sitemap. To launch, drop both flags and re-add the path to STATIC_ROUTES
// in app/sitemap.ts.
export const metadata = buildPageMetadata({
  title: "Tricorder: The Intelligence Layer for Software Trust | CleanStart",
  absoluteTitle: true,
  description: DESCRIPTION,
  path: "/tricorder",
  variant: "hero",
  eyebrow: "Products",
  ogTitle: "The Intelligence Layer for Software Trust",
  titleAccent: "Software Trust",
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function TricorderPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/tricorder", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Tricorder" },
    ]),
    softwareApplicationSchema({
      name: "Tricorder",
      description: DESCRIPTION,
      path: "/tricorder",
    }),
  ]);
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
