import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { CleanStartFactory } from "@/components/sections/CleanStartFactory";
import { HowCleanStartHelp } from "@/components/sections/HowCleanStartHelp";
import { BuiltForTeams } from "@/components/sections/BuiltForTeams";
import { FrequentlyAskedQuestions } from "@/components/sections/FrequentlyAskedQuestions";
import { ResourcesInsights } from "@/components/sections/ResourcesInsights";
import { ReadyToSecureCTA } from "@/components/sections/ReadyToSecureCTA";
import { Footer } from "@/components/sections/Footer";
import { SecurityNotPatching } from "@/components/sections/SecurityNotPatching";
import { CleanStartAdvantage } from "@/components/sections/CleanStartAdvantage";
import { FadeUp } from "@/components/ui/FadeUp";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + CleanStartFactory share ONE Figma frame (108:8631, 1920×2209) — render
             them inside one wrapper that owns the continuous gradient + purple blob overlays. */}
        <div className="bg-cs-hero bg-cs-grid relative overflow-hidden">
          {/* Decorative purple radial blobs (Figma "Union" vectors, #640DFB radial fill) */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "75%",
              top: "39%",
              width: "1101px",
              height: "1101px",
              background:
                "radial-gradient(closest-side, #640DFB 0%, rgba(100, 13, 251, 0) 100%)",
              opacity: 0.30,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "-20%",
              top: "124%",
              width: "1101px",
              height: "1101px",
              background:
                "radial-gradient(closest-side, #640DFB 0%, rgba(100, 13, 251, 0) 100%)",
              opacity: 0.10,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "-17%",
              top: "182%",
              width: "1101px",
              height: "1101px",
              background:
                "radial-gradient(closest-side, #640DFB 0%, rgba(100, 13, 251, 0) 100%)",
              opacity: 0.10,
            }}
          />

          <div className="relative">
            <Hero />
            <FadeUp>
              <CleanStartFactory />
            </FadeUp>
          </div>
          {/* Bottom fade — softens the dark Hero/Factory wrapper into the
              #F6F6F6 page bg of the section below. Per Figma 108:8631 the
              dark gradient fill itself fades to alpha 0 over its last ~15%
              with intermediate alpha steps; we replicate that smoothness
              with a 5-stop gradient (~420px tall) easing from transparent
              through warm purple haze to solid #F6F6F6. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[360px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(246, 246, 246, 0) 0%, rgba(246, 246, 246, 0.08) 20%, rgba(246, 246, 246, 0.25) 45%, rgba(246, 246, 246, 0.55) 65%, rgba(246, 246, 246, 0.85) 85%, #F6F6F6 100%)",
            }}
          />
        </div>

        {/* Order matches Figma: Security → Advantage stats → How Will Help → Testimonials */}
        <FadeUp>
          <SecurityNotPatching />
        </FadeUp>
        <FadeUp>
          <CleanStartAdvantage />
        </FadeUp>
        <FadeUp>
          <HowCleanStartHelp />
        </FadeUp>
        <FadeUp>
          <BuiltForTeams />
        </FadeUp>
        <FadeUp>
          <FrequentlyAskedQuestions />
        </FadeUp>
        <FadeUp>
          <ResourcesInsights />
        </FadeUp>
        <FadeUp>
          <ReadyToSecureCTA />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
