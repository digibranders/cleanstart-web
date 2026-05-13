import { Header } from "@/components/sections/Header";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { AboutWhoWeAre } from "@/components/sections/about/AboutWhoWeAre";
import { AboutOurStory } from "@/components/sections/about/AboutOurStory";
import { AboutOurVision } from "@/components/sections/about/AboutOurVision";
import { AboutPowering } from "@/components/sections/about/AboutPowering";
import { AboutEcosystems } from "@/components/sections/about/AboutEcosystems";
import { AboutCTA } from "@/components/sections/about/AboutCTA";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";

export const metadata = {
  title: "About Us | CleanStart",
  description:
    "CleanStart builds trusted software delivery by integrating security, compliance, and provenance into every build.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero shares the same dark gradient wrapper as the homepage hero */}
        <div className="bg-cs-hero bg-cs-grid relative overflow-hidden">
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
          <AboutPowering />
        </FadeUp>

        <FadeUp>
          <AboutEcosystems />
        </FadeUp>

        <FadeUp>
          <AboutCTA />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
