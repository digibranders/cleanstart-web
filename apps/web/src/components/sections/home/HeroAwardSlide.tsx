import Image from "next/image";
import Link from "next/link";

import { HeroReveal } from "@/components/ui/Reveal";

// "Read Full Story" CTA → the CleanStart award announcement on our own /news
// listing. Internal route, so it's a Next <Link> (client-side nav), not an
// external anchor.
const STORY_HREF =
  "/news/cleanstart-named-winner-in-software-supply-chain-security-at-the-2026-cybersecurity-stars-awards";

// CleanStart V4 hero carousel slide 2: the "Winners of 2026 — Cybersecurity
// Stars Awards" campaign. The in-flow content (headline → lead → CTA) is kept
// structurally identical to the product slide (HeroProductSlide) so that, with
// both slides vertically centered in the shared carousel cell, the headlines AND
// the CTAs line up across the crossfade. The eyebrow chip is positioned
// ABSOLUTELY above the headline so it never shifts the headline down. The lead
// is width-capped to wrap to two lines, matching the product slide's lead.
//
// Typography consumes role tokens (--fs-display-home / --fs-lead) per the
// typography system — NOT Figma's 88 / 30 px. The headline is a styled <p>, NOT
// an <h1>, so the home page keeps exactly one h1 (the product slide).
export function HeroAwardSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center gap-12 lg:h-full lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      {/* Violet glow behind the medal — additive, fades with the slide. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "4%",
          top: "50%",
          width: "min(560px, 60vw)",
          height: "min(560px, 60vw)",
          transform: "translateY(-50%)",
          background:
            "radial-gradient(circle at 50% 50%, rgba(192,59,255,0.5) 0%, rgba(192,59,255,0) 70%)",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      {/* Left column — copy. In-flow order matches the product slide exactly. */}
      <div className="relative z-10 flex w-full max-w-[620px] flex-col items-center text-center lg:items-start lg:text-left">
        {/* Headline + floating eyebrow (eyebrow is out of flow so the headline
            aligns with the product slide's <h1>). */}
        <div className="relative">
          <div className="mb-3 flex justify-center lg:absolute lg:bottom-[calc(100%+0.75rem)] lg:left-0 lg:mb-0 lg:block lg:justify-start">
            <HeroReveal y={16} delay={0.06} duration={0.7}>
              <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span
                  className="grid shrink-0 place-items-center rounded-full"
                  style={{ width: 20, height: 20, background: "#ECB347" }}
                >
                  <span
                    className="block rounded-full"
                    style={{ width: 12, height: 12, background: "#121030" }}
                  />
                </span>
                <span
                  className="text-white"
                  style={{
                    fontSize: "var(--fs-body)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Software Supply Chain Security
                </span>
              </div>
            </HeroReveal>
          </div>

          <HeroReveal y={36} delay={0.12} duration={0.85}>
            <p
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-display-home)",
                letterSpacing: "var(--fs-display-ls)",
                lineHeight: 1.05,
              }}
            >
              <span className="block">Proud Winner Of</span>
              <span
                className="block"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #E8A741 0%, #F0BE4C 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Cybersecurity Stars Award 2026
              </span>
            </p>
          </HeroReveal>
        </div>

        <HeroReveal y={30} delay={0.2} duration={0.8}>
          <p
            className="mt-6 max-w-[600px] text-white/80"
            style={{
              fontSize: "var(--fs-lead)",
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
            }}
          >
            By The Hacker News — recognizing excellence in software supply chain
            security.
          </p>
        </HeroReveal>

        <HeroReveal y={30} delay={0.28} duration={0.8}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href={STORY_HREF}
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
              <span>Read Full Story</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ marginLeft: 2 }}
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="#111111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </HeroReveal>
      </div>

      {/* Right column — award medal */}
      <HeroReveal
        y={40}
        delay={0.15}
        duration={1.0}
        className="relative z-10 flex w-full max-w-[440px] shrink-0 justify-center lg:w-[46%] lg:max-w-none lg:justify-start"
      >
        <Image
          src="/images/home/award-winner-2026.webp"
          alt="CleanStart — Winner of the 2026 Cybersecurity Stars Awards by The Hacker News"
          width={440}
          height={440}
          sizes="(min-width: 1024px) 440px, (min-width: 640px) 60vw, 80vw"
          className="h-auto w-full max-w-[440px] drop-shadow-[0_24px_60px_rgba(100,13,251,0.35)]"
          priority={false}
        />
      </HeroReveal>
    </div>
  );
}
