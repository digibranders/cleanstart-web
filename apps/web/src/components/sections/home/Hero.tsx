import Link from "next/link";

import { BrandMarquee } from "@/components/sections/home/BrandMarquee";
import { HeroHeading } from "@/components/sections/home/HeroHeading";
import { LivePostureReport } from "@/components/sections/home/LivePostureReport";
import { HeroReveal } from "@/components/ui/Reveal";

// CleanStart V4 hero: left-aligned headline + lead + glass CTA on the left,
// the CleanSight "Posture Report" panel — now a live, code-built component
// (LivePostureReport) that scans/animates itself — floating on the right, with
// the brand marquee spanning below. Typography consumes the role tokens
// (--fs-display-home / --fs-lead) per the typography system — NOT the Figma px
// values (88 / 30) which exceed the role scale. The home hero uses the larger
// 36 → 64 --fs-display-home cap; other heroes keep --fs-display.
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[calc(clamp(96px,8vw,120px)+var(--cs-header-extra))]">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* Left column — copy */}
          <div className="flex w-full max-w-[620px] flex-col items-center text-center lg:items-start lg:text-left">
            <HeroHeading />

            <HeroReveal y={36} delay={0.12} duration={0.85}>
              <p
                className="mt-6 max-w-[560px] text-white/80"
                style={{
                  fontSize: "var(--fs-lead)",
                  lineHeight: 1.4,
                  letterSpacing: "-0.02em",
                }}
              >
                Build AI-native applications with verified,{" "}
                <span className="whitespace-nowrap">zero-CVE</span> container
                images and libraries
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.24} duration={0.8}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href="https://images.cleanstart.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-btn-glass"
                  style={{
                    ["--cs-btn-h" as string]: "44px",
                    ["--cs-btn-px" as string]: "16px",
                    ["--cs-btn-fs" as string]: "17px",
                    color: "#111111",
                    letterSpacing: "-0.05em",
                    fontWeight: 500,
                  }}
                >
                  <span>Browse Images</span>
                </a>

                <Link
                  href="/contact-us"
                  className="cs-btn-ghost"
                  style={{
                    ["--cs-btn-h" as string]: "44px",
                    ["--cs-btn-px" as string]: "16px",
                    ["--cs-btn-fs" as string]: "17px",
                    letterSpacing: "-0.05em",
                  }}
                >
                  <span>Contact Us</span>
                </Link>
              </div>
            </HeroReveal>
          </div>

          {/* Right column — live CleanSight posture-report panel */}
          <HeroReveal
            y={40}
            delay={0.15}
            duration={1.0}
            className="w-full max-w-[560px] shrink-0 lg:mr-[40px] lg:w-[48%]"
          >
            <LivePostureReport />
          </HeroReveal>
        </div>

        <div className="pb-2 pt-16 lg:pt-24">
          <BrandMarquee />
        </div>
      </div>
    </section>
  );
}
