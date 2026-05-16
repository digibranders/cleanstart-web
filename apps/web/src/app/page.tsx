import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/home/Hero";
import { CleanStartFactory } from "@/components/sections/home/CleanStartFactory";
import { HowCleanStartHelp } from "@/components/sections/home/HowCleanStartHelp";
import { BuiltForTeams } from "@/components/sections/home/BuiltForTeams";
import { FrequentlyAskedQuestions } from "@/components/sections/home/FrequentlyAskedQuestions";
import { ResourcesInsights } from "@/components/sections/home/ResourcesInsights";
import { ReadyToSecureCTA, ReadyToSecureCTAOverlay } from "@/components/sections/home/ReadyToSecureCTA";
import { Footer } from "@/components/sections/Footer";
import { SecurityNotPatching } from "@/components/sections/home/SecurityNotPatching";
import { CleanStartAdvantage } from "@/components/sections/home/CleanStartAdvantage";
import { FadeUp } from "@/components/ui/FadeUp";
import Image from "next/image";

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
        {/* FAQ + Resources share one continuous #F6F6F6 canvas so their
            transparent backgrounds and decorative blobs/grids bleed across
            section boundaries without a hard edge. */}
        <div className="relative bg-[#F6F6F6] pb-[250px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {/* LEFT-TOP grid — Figma 108:8523, x=-435, y=5488 in 1920 frame.
                Wrapper-relative top = 5488−6231 = −743px. */}
            <Image
              src="/images/faq/bg-grid-faq-left.svg"
              alt=""
              width={1101}
              height={1101}
              unoptimized
              loading="eager"
              className="absolute"
              style={{ left: "-435px", top: "-743px", width: "1101px", height: "1101px", maxWidth: "none" }}
            />
            {/* RIGHT-MIDDLE grid — Figma 108:8524, x=1392, y=6657.
                Right = 1920−1392−1101 = −573px; top = 6657−6231 = 426px. */}
            <Image
              src="/images/faq/bg-grid-faq-right.svg"
              alt=""
              width={1101}
              height={1101}
              unoptimized
              loading="eager"
              className="absolute"
              style={{ right: "-573px", top: "426px", width: "1101px", height: "1101px", maxWidth: "none" }}
            />
            {/* LEFT-BOTTOM grid — Figma 108:7625, x=-343, y=7736.
                Wrapper-relative top = 7736−6231 = 1505px. */}
            <Image
              src="/images/faq/bg-grid-faq-bottom-left.svg"
              alt=""
              width={1101}
              height={1101}
              unoptimized
              loading="eager"
              className="absolute"
              style={{ left: "-343px", top: "1505px", width: "1101px", height: "1101px", maxWidth: "none" }}
            />
          </div>
          <FadeUp>
            <FrequentlyAskedQuestions />
          </FadeUp>
          <FadeUp>
            <ResourcesInsights />
          </FadeUp>
        </div>
      </main>
      <Footer cta={<ReadyToSecureCTA />} ctaOverlay={<ReadyToSecureCTAOverlay />} />
    </>
  );
}
