import { Header } from "@/components/nav/Header";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { AboutWhoWeAre } from "@/components/sections/about/AboutWhoWeAre";
import { AboutOurStory } from "@/components/sections/about/AboutOurStory";
import { AboutOurVision } from "@/components/sections/about/AboutOurVision";
import { AboutGlobalPresence } from "@/components/sections/about/AboutGlobalPresence";
import { AboutEcosystems } from "@/components/sections/about/AboutEcosystems";
import { AboutCTA } from "@/components/sections/about/AboutCTA";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "About CleanStart | Building Trusted Software Foundations",
  absoluteTitle: true,
  description:
    "How CleanStart builds the foundation for trusted software delivery, with security, compliance, and provenance in every build from source to production.",
  path: "/about-us",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function AboutPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/about-us", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About Us" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="about-us-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        {/* overflow stays visible below lg so the mobile cube in AboutHero can
            break out and overlap into AboutWhoWeAre. */}
        <div className="bg-cs-hero relative overflow-visible lg:overflow-hidden">
          <div className="relative">
            <AboutHero />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.40) 80%, rgba(255,255,255,0.70) 95%, #ffffff 100%)",
            }}
          />
        </div>

        <FadeUp>
          <AboutWhoWeAre />
        </FadeUp>

        <FadeUp>
          <AboutOurStory />
        </FadeUp>

        <FadeUp>
          <AboutOurVision />
        </FadeUp>

        <FadeUp>
          <AboutGlobalPresence />
        </FadeUp>

        <FadeUp>
          <AboutEcosystems />
        </FadeUp>
      </main>
      <Footer cta={<AboutCTA />} />
    </>
  );
}
