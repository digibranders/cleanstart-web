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

      <div className="relative mx-auto w-full max-w-[1276px] px-6 py-section-lg">
        {/* Intro: title + description (Figma Frame 10 at 316,3438 — 517×265) */}
        <div className="max-w-[517px]">
          <h2
            id="advantage-title"
            className="font-display text-display-md font-semibold leading-[1.05] tracking-[-0.05em] text-white"
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
            className="mt-6 text-[clamp(1rem,1.6vw,1.625rem)] font-normal leading-[1.5] tracking-[-0.05em] text-white"
          >
            Real results from teams that replaced vulnerable public images with
            CleanStart&rsquo;s hardened, source-built containers
          </p>
        </div>

        {/* Stats row — 5 stats with 4 vertical gradient separators between them.
            On mobile, stats wrap into a 2-col grid (separators hide). */}
        <div className="mt-12 grid grid-cols-1 gap-y-8 sm:mt-16 sm:grid-cols-3 sm:gap-y-10 lg:mt-[120px] lg:flex lg:items-start lg:justify-between lg:gap-6">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} />
              {i < STATS.length - 1 && (
                <span className="hidden lg:contents">
                  <Separator />
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatBlock({ stat }: { stat: Stat }) {
  return (
    <div className="flex shrink-0 flex-col">
      <div
        className="font-display text-4xl font-bold leading-none tracking-[-0.05em] text-white"
        style={{ whiteSpace: "nowrap" }}
      >
        {stat.value}
      </div>
      <div className="mt-5 max-w-[180px] text-2xl font-medium leading-[1.1] tracking-[-0.05em] text-white">
        {stat.label}
      </div>
    </div>
  );
}

function Separator() {
  // 1×109 vertical gradient line (Figma Rectangle 19/23/24/25)
  // 0% transparent → 49.3% solid white → 99.2% gray fading to transparent
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
