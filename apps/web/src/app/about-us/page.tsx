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
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "About CleanStart | Building Trusted Software Foundations",
  absoluteTitle: true,
  description:
    "Learn how CleanStart is building the foundation for trusted software delivery, integrating security, compliance, and provenance into every build from source to production.",
  path: "/about-us",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        id="about-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About Us" },
        ])}
      />
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
