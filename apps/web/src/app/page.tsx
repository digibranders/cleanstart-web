import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { Header } from "@/components/nav/Header";
import { Hero } from "@/components/sections/home/Hero";
import { CleanStartFactory } from "@/components/sections/home/CleanStartFactory";
import { HowCleanStartHelp } from "@/components/sections/home/HowCleanStartHelp";
// BuiltForTeams (~480L "use client" testimonial carousel) sits below the fold;
// code-split so it does not ship in the initial home-page client bundle.
const BuiltForTeams = dynamic(() =>
  import("@/components/sections/home/BuiltForTeams").then((m) => ({ default: m.BuiltForTeams })),
);
import { FrequentlyAskedQuestions } from "@/components/sections/home/FrequentlyAskedQuestions";
import { ResourcesInsights } from "@/components/sections/home/ResourcesInsights";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import { Footer } from "@/components/sections/Footer";
import { SecurityNotPatching } from "@/components/sections/home/SecurityNotPatching";
import { CleanStartAdvantage } from "@/components/sections/home/CleanStartAdvantage";
import { FadeUp } from "@/components/ui/FadeUp";
import Image from "next/image";

export const metadata: Metadata = buildPageMetadata({
  title: "CleanStart — Secure by Design. Built from Source.",
  description:
    "Verified container images. Built from source, hardened, signed, and continuously verified.",
  path: "/",
  variant: "hero",
  ogTitle: "Secure by Design. Built from Source.",
  titleAccent: "Built from Source.",
});

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-cs-hero relative overflow-hidden">
          {/* Hero-top Mask group — Figma export (1440×569 SVG with internal
              viewBox spanning the full 1920 px frame). Contains the 27×8
              dark-navy tech grid plus the two purple ellipse glows plus the
              four small line accents, all baked in. Pinned to the top of the
              bg-cs-hero wrapper, decorative-only. ~20 KB on the wire. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/home/mask-group.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 w-full select-none"
            style={{ height: "auto", maxWidth: "none" }}
            loading="eager"
            decoding="async"
          />

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
          {/* Bottom fade removed (2026-05) — the white-to-transparent
              gradient was washing out the factory's rocket-exhaust flares
              and the dark hero backdrop overall. The next section
              (`SecurityNotPatching`) starts cleanly with its own #F6F6F6
              background, giving a hard contrast edge that lets the dark
              factory and the bright section below each own their space. */}
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
        <div className="relative overflow-hidden bg-[#F6F6F6] pb-section-cta">
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
              sizes="1101px"
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
              sizes="1101px"
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
              sizes="1101px"
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
      <Footer cta={<ReadyToSecureCTA />} />
    </>
  );
}
