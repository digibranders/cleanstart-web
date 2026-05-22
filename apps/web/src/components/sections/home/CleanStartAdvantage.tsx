import React from "react";
import Image from "next/image";

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
 *     Stat 2  x=288 w=126   "97.6%"     "Average CVE reduction"
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
  { value: "97.6%",    label: "Average CVE reduction" },
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
      {/* Background image */}
      <Image
        src="/images/advantage-bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center"
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
          <h2
            id="advantage-title"
            className="font-display font-semibold text-white"
            style={{
              fontSize: "var(--text-t-display-2)",
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
            }}
          >
            CleanStart{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(95deg, #9A50FF 0%, #2CC1EB 100%)",
              }}
            >
              Advantage
            </span>
          </h2>
          <p
            className="mt-6 font-normal text-white"
            style={{
              fontSize: "var(--text-t-subhead)",
              lineHeight: "var(--text-t-subhead-lh)",
              letterSpacing: "var(--text-t-subhead-ls)",
            }}
          >
            Real results from teams that replaced vulnerable public images with
            CleanStart&rsquo;s hardened, source-built containers
          </p>
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
    // Figma 403:15688 — Manrope Bold 32 / lh 1.0 / -0.05em over Sora 16 / lh 1.1 / -0.05em
    return (
      <div className="flex w-[222px] flex-col gap-3">
        <div
          className="font-display font-bold text-white"
          style={{
            whiteSpace: "nowrap",
            fontSize: "32px",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          {stat.value}
        </div>
        <div
          className="font-normal text-white"
          style={{
            fontSize: "16px",
            lineHeight: 1.1,
            letterSpacing: "-0.05em",
          }}
        >
          {stat.label}
        </div>
      </div>
    );
  }
  // Desktop variant uses the unified type-scale tokens.
  return (
    <div className="flex shrink-0 flex-col">
      <div
        className="font-display font-bold text-white"
        style={{
          whiteSpace: "nowrap",
          fontSize: "var(--text-t-heading-lg)",
          lineHeight: "var(--text-t-heading-lg-lh)",
          letterSpacing: "var(--text-t-heading-lg-ls)",
        }}
      >
        {stat.value}
      </div>
      <div
        className="mt-5 max-w-[180px] font-normal text-white"
        style={{
          fontSize: "var(--text-t-heading-md)",
          lineHeight: "var(--text-t-heading-md-lh)",
          letterSpacing: "var(--text-t-heading-md-ls)",
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
