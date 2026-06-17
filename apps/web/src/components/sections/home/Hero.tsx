import Image from "next/image";
import { ArrowRightShort } from "@/components/icons/ArrowRightShort";
import { BrandMarquee } from "@/components/sections/home/BrandMarquee";
import { HeroHeading } from "@/components/sections/home/HeroHeading";
import { HeroReveal } from "@/components/ui/Reveal";

// CleanStart V4 hero: left-aligned headline + lead + glass CTA on the left,
// the CleanSight "Posture Report" panel (exported flat from Figma) floating on
// the right, with the brand marquee spanning below. Typography consumes the
// role tokens (--fs-display-home / --fs-lead) per the typography system — NOT
// the Figma px values (88 / 30) which exceed the role scale. The home hero uses
// the larger 36 → 64 --fs-display-home cap; other heroes keep --fs-display.
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
              <a
                href="https://images.cleanstart.com"
                target="_blank"
                rel="noopener noreferrer"
                className="cs-btn-glass mt-10"
                style={{
                  ["--cs-btn-px" as string]: "18px",
                  ["--cs-btn-fs" as string]: "20px",
                  color: "#111111",
                  letterSpacing: "-0.05em",
                  fontWeight: 500,
                }}
              >
                <span>Browse Images</span>
                <ArrowRightShort className="cs-cta-arrow text-[#111111]" />
              </a>
            </HeroReveal>
          </div>

          {/* Right column — CleanSight posture-report panel */}
          <HeroReveal
            y={40}
            delay={0.15}
            duration={1.0}
            className="w-full max-w-[490px] shrink-0 lg:mr-[60px] lg:w-[42%]"
          >
            <div className="relative mx-auto w-full max-w-[490px]">
              {/* Soft purple/blue bloom behind the panel (Figma ellipse glow). */}
              <div
                aria-hidden
                className="pointer-events-none absolute select-none"
                style={{
                  left: "8%",
                  top: "16%",
                  width: "92%",
                  height: "92%",
                  background:
                    "radial-gradient(closest-side, rgba(100, 13, 251, 0.55) 0%, rgba(100, 13, 251, 0) 100%)",
                  filter: "blur(8px)",
                }}
              />
              <Image
                src="/images/home/hero-dashboard-panel.png"
                alt="CleanSight posture report comparing CVE counts across standard and CleanStart-verified container images"
                width={859}
                height={1024}
                sizes="(min-width: 1024px) 520px, (min-width: 640px) 70vw, 90vw"
                priority
                className="relative h-auto w-full"
              />

              {/* Lens flares at the panel's top-right and bottom-left corners
                  (Figma 光斑 flare), screen/lighten-blended so only the glow
                  shows. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/home/hero-flare.png"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute select-none"
                style={{
                  width: "40%",
                  left: "98%",
                  top: "4%",
                  transform: "translate(-50%, -50%)",
                  mixBlendMode: "lighten",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/home/hero-flare.png"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute select-none"
                style={{
                  width: "40%",
                  left: "2%",
                  top: "93%",
                  transform: "translate(-50%, -50%)",
                  mixBlendMode: "lighten",
                }}
              />
            </div>
          </HeroReveal>
        </div>

        <div className="pb-2 pt-16 lg:pt-24">
          <BrandMarquee />
        </div>
      </div>
    </section>
  );
}
