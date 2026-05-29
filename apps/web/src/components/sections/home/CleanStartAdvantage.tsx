import React from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

/**
 * CleanStart Advantage section — Figma frame 108:7864 (1920×817)
 * Children: bg image overlay, intro frame (108:7868), stats row (108:7872)
 *
 * Title (108:7869) — Manrope SemiBold 62px, line 100%, letter-spacing -5%
 *   "CleanStart " in solid white
 *   "Advantage" in linear gradient #9A50FF → #2CC1EB
 *
 * Description (108:7870) — Sora Regular 26px, line 150%, letter-spacing -5%, white
 *
 * Stats row (108:7872) — 1276×109. Five stat blocks with four 1×109 vertical
 *   separators (white-fading gradient). Exact x positions extracted from Figma:
 *     Stat 1  x=0   w=136   "88,000+"   "CVEs remediated"
 *     Sep 1   x=212
 *     Stat 2  x=288 w=126   "~90%"      "Average CVE reduction"
 *     Sep 2   x=490
 *     Stat 3  x=566 w=152   "352,000+"  "Engineering hours saved"
 *     Sep 3   x=794
 *     Stat 4  x=870 w=138   "10M+"      "Packages from verified source"
 *     Sep 4   x=1084
 *     Stat 5  x=1160 w=116  "100%"      "Deterministic builds"
 *
 * Stat number — Manrope Bold 36px, line 100%, letter-spacing -5%
 * Stat label  — Sora Medium 24px, line 110%, letter-spacing -5%
 */

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "88,000+",  label: "CVEs remediated" },
  { value: "~90%",     label: "Average CVE reduction" },
  { value: "352,000+", label: "Engineering hours saved" },
  { value: "10M+",     label: "Packages from verified source" },
  { value: "100%",     label: "Deterministic builds" },
];

export function CleanStartAdvantage() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="advantage-title"
    >
      {/* Background image — mobile portrait below md, full-bleed photo above */}
      <Image
        src="/images/home/advantage-bg-mobile.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center md:hidden"
        style={{ filter: "blur(1.5px)", transform: "scale(1.01)" }}
        priority={false}
      />
      <Image
        src="/images/advantage-bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center hidden md:block"
        style={{ filter: "blur(1.5px)", transform: "scale(1.01)" }}
        priority={false}
      />
      {/* Dark gradient overlay so title/text remain readable on the photo */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,12,55,0.92) 0%, rgba(50,25,135,0.78) 35%, rgba(70,30,180,0.45) 65%, rgba(70,30,180,0.10) 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg">
        {/* Intro: title + description (Figma Frame 10 at 316,3438 — 517×265) */}
        <div className="max-w-[517px]">
          <Reveal header>
            <h2
              id="advantage-title"
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              CleanStart{" "}
              <span className="cs-text-gradient-impact">Advantage</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              className="mt-6 text-white"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
              }}
            >
              Real results from teams that replaced vulnerable public images with
              CleanStart&rsquo;s hardened, source-built containers
            </p>
          </Reveal>
        </div>

        {/* Stats — two layouts:
            • Mobile/tablet (< lg) — Figma 403:15688 vertical stack:
              5 stat blocks (32 px number / 16 px label / 12 px internal gap)
              separated by 147 px-wide horizontal gradient lines, 24 px gap.
            • Desktop (lg+) — 5 stats inline with 1×109 vertical separators. */}
        <div className="mt-12 flex flex-col gap-6 sm:mt-14 lg:hidden">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} variant="mobile" />
              {i < STATS.length - 1 && <HorizontalDivider />}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden lg:mt-[120px] lg:flex lg:items-start lg:justify-between lg:gap-6">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} variant="desktop" />
              {i < STATS.length - 1 && <VerticalDivider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  stat,
  variant,
}: {
  stat: Stat;
  variant: "mobile" | "desktop";
}) {
  if (variant === "mobile") {
    // Home stat spec: number 32/700/Manrope · label 24/400/Sora
    return (
      <div className="flex w-[222px] flex-col gap-3">
        <div
          className="font-display text-white"
          style={{
            whiteSpace: "nowrap",
            fontSize: "var(--fs-h3)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
          }}
        >
          {stat.value}
        </div>
        <div
          className="text-white"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-lead)",
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
          }}
        >
          {stat.label}
        </div>
      </div>
    );
  }
  // Desktop variant — Home stat spec: number 32/700/Manrope · label 20/400/Sora
  return (
    <div className="flex shrink-0 flex-col">
      <div
        className="font-display text-white"
        style={{
          whiteSpace: "nowrap",
          fontSize: "32px",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
        }}
      >
        {stat.value}
      </div>
      <div
        className="mt-5 max-w-[180px] text-white"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "20px",
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

function VerticalDivider() {
  // 1×109 vertical gradient line (Figma Rectangle 19/23/24/25) — desktop.
  return (
    <div
      aria-hidden
      className="h-[109px] w-px shrink-0 self-stretch"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 49.3%, rgba(153,153,153,0) 99.2%)",
      }}
    />
  );
}

function HorizontalDivider() {
  // 147×1 horizontal gradient line — Figma mobile divider (node 403:15692).
  // Exact stops from the source SVG linearGradient:
  //   0%     → white  opacity 0
  //   49.32% → white  opacity 1
  //   99.18% → #999   opacity 0
  return (
    <div
      aria-hidden
      className="h-px w-[147px] shrink-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, #FFFFFF 49.32%, rgba(153,153,153,0) 99.18%)",
      }}
    />
  );
}
