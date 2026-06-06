import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { Header } from "@/components/nav/Header";
import { Hero } from "@/components/sections/home/Hero";
import { PlatformPipeline } from "@/components/sections/home/PlatformPipeline";
import { AudienceTabs } from "@/components/sections/home/AudienceTabs";
import { SecurityNotPatching } from "@/components/sections/home/SecurityNotPatching";
// Testimonials (~480L "use client" testimonial carousel) sits below the fold;
// code-split so it does not ship in the initial home-page client bundle.
const Testimonials = dynamic(() =>
  import("@/components/sections/home/Testimonials").then((m) => ({ default: m.Testimonials })),
);
import { FrequentlyAskedQuestions } from "@/components/sections/home/FrequentlyAskedQuestions";
import { ResourcesInsights } from "@/components/sections/home/ResourcesInsights";
import { ReadyToSecureCTA } from "@/components/sections/home/ReadyToSecureCTA";
import { Footer } from "@/components/sections/Footer";
import { CleanStartAdvantage } from "@/components/sections/home/CleanStartAdvantage";
import { FadeUp } from "@/components/ui/FadeUp";
import Image from "next/image";

export const metadata: Metadata = buildPageMetadata({
  title: "Verified & Secure Container Images | CleanStart",
  absoluteTitle: true,
  description:
    "Build on verified, near zero vulnerability container images with cryptographic provenance. CleanStart delivers hardened, FIPS compliant, SBOM backed images for trusted software delivery.",
  path: "/",
  variant: "hero",
  ogTitle: "Verified & Secure Container Images",
  titleAccent: "Secure Container Images",
});

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-cs-hero relative overflow-hidden">
          {/* Decorative hero-top mask: dark-navy tech grid, two purple ellipse
              glows, and four line accents baked into one SVG pinned to the top
              of the bg-cs-hero wrapper. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/home/mask-group.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 w-full select-none"
            style={{
              height: "auto",
              maxWidth: "none",
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 46%, transparent 62%)",
              maskImage:
                "linear-gradient(to bottom, #000 46%, transparent 62%)",
            }}
            loading="eager"
            decoding="async"
          />

          {/* Decorative purple radial blobs (#640DFB radial fill) */}
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
              <PlatformPipeline />
            </FadeUp>
          </div>
          {/* Bottom fade removed (2026-05) — the white-to-transparent
              gradient was washing out the factory's rocket-exhaust flares
              and the dark hero backdrop overall. The next section
              (`SecurityNotPatching`) starts cleanly with its own #F6F6F6
              background, giving a hard contrast edge that lets the dark
              factory and the bright section below each own their space. */}
        </div>

        <FadeUp>
          <SecurityNotPatching />
        </FadeUp>
        <FadeUp>
          <Testimonials />
        </FadeUp>
        <FadeUp>
          <AudienceTabs />
        </FadeUp>
        <FadeUp>
          <CleanStartAdvantage />
        </FadeUp>
        {/* FAQ + Resources share one continuous #F6F6F6 canvas so their
            transparent backgrounds and decorative blobs/grids bleed across
            section boundaries without a hard edge. */}
        <div className="relative overflow-hidden bg-[#F6F6F6] pb-section-cta">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
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
