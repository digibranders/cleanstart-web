import { HeroReveal } from "@/components/ui/Reveal";

export function TeamsHero() {
  return (
    <section
      /* min-height removed entirely — was leaving ~140px of dead gradient
         space below the paragraph on desktop (content only needs ~350px,
         old floor was 490px). Section now hugs content on both viewports;
         pt-[clamp(72,8vw,128)] + pb-[80px] padding still gives the hero
         plenty of vertical breathing room. */
      className="relative overflow-hidden"
      style={{
        backgroundColor: "#151021",
        backgroundImage:
          "linear-gradient(179.998deg, rgb(21,16,33) 25.702%, rgb(16,18,62) 43.563%, rgb(19,30,143) 67.739%, rgb(71,30,192) 89.306%, rgb(71,31,195) 102.85%, rgba(70,30,191,0.85) 109.17%, rgba(66,30,188,0.4) 119.77%, rgba(66,30,188,0) 126.11%)",
      }}
    >
      {/* ── Glow blob — large, left-center (Figma Ellipse 46641, rotate 43°) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "-280px",
          top: "-358px",
          width: "1301px",
          height: "1295px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: "rotate(43deg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/teams/ellipse-glow-inner.svg"
            alt=""
            width={974}
            height={862}
            loading="eager"
            decoding="async"
            style={{ display: "block", maxWidth: "none" }}
          />
        </div>
      </div>

      {/* ── Glow streak — narrow, top-right (Figma Ellipse 46640, rotate 43°) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none hidden lg:flex"
        style={{
          left: "calc(1267px / 1920 * 100%)",
          top: "-92px",
          width: "308px",
          height: "317px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: "rotate(43deg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/teams/ellipse-glow-outer.svg"
            alt=""
            width={129}
            height={313}
            loading="eager"
            decoding="async"
            style={{ display: "block", maxWidth: "none" }}
          />
        </div>
      </div>

      {/* ── Accent lines — vertical gradient strokes matching Figma layout ── */}
      {/* Line 104: left 1351px, top 72px, h 70px — one-sided fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "calc(1351px / 1920 * 100%)",
          top: "72px",
          width: "1px",
          height: "70px",
          background:
            "linear-gradient(to bottom, rgba(133,107,255,0.5), rgba(133,107,255,0))",
        }}
      />
      {/* Line 106: left 213px, top 142px, h 142px — both-end fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "calc(213px / 1920 * 100%)",
          top: "142px",
          width: "1px",
          height: "142px",
          background:
            "linear-gradient(to bottom, transparent, rgba(133,107,255,0.28), transparent)",
        }}
      />
      {/* Line 106: left 426px, top 285px, h 142px — both-end fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "calc(426px / 1920 * 100%)",
          top: "285px",
          width: "1px",
          height: "142px",
          background:
            "linear-gradient(to bottom, transparent, rgba(133,107,255,0.28), transparent)",
        }}
      />
      {/* Line 108: left 142px, top 355px, h 142px — both-end fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "calc(142px / 1920 * 100%)",
          top: "355px",
          width: "1px",
          height: "142px",
          background:
            "linear-gradient(to bottom, transparent, rgba(133,107,255,0.28), transparent)",
        }}
      />
      {/* Line 105: left 1564px, top 142px, h 70px — reversed one-sided fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "calc(1564px / 1920 * 100%)",
          top: "142px",
          width: "1px",
          height: "70px",
          background:
            "linear-gradient(to bottom, rgba(133,107,255,0), rgba(133,107,255,0.5))",
        }}
      />

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="flex flex-col items-center gap-6 pb-[80px] pt-[clamp(112px,8vw,128px)] text-center">
          <HeroReveal y={50} duration={1.0}>
            <h1
              className="w-full font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-display)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
              }}
            >
              {"United by "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(120.16deg, rgb(154,81,255) 1.7578%, rgb(44,193,235) 98.781%)",
                }}
              >
                Purpose
              </span>
            </h1>
          </HeroReveal>
          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="max-w-[911px] font-sans text-white/80"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: "1.4",
                letterSpacing: "-0.04em",
              }}
            >
              Our teams bring deep expertise in security, compliance, and
              engineering, connected by a shared commitment to building trusted
              software from the start
            </p>
          </HeroReveal>
        </div>
      </div>

    </section>
  );
}
