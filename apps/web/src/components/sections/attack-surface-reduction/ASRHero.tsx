import Image from "next/image";
import Link from "next/link";

/**
 * ASR Hero — Figma node 783:91
 *
 * Background:
 *  - Vertical gradient: #151021 → #10123E → #131E8F → #471EC0 → fade to transparent.
 *  - 80px CSS grid overlay (#130F26 lines on the dark base).
 *  - Purple #7A59FF radial blob top-right (heavy blur).
 *
 * Content:
 *  - Heading "Bigger Images, Bigger Risk" — "Bigger Risk" in cyan→purple gradient.
 *  - Body copy: "CleanStart Images reduce attack surface by eliminating
 *    unnecessary components before they enter production."
 *  - Glass CTA "Explore Cleanstart Images" — .cs-btn-glass utility.
 *  - Right side: bloated-vs-clean comparison card image (hero-cards.png).
 *
 * Per request: colours / images / CTA style / gradients match Figma exactly,
 * but pixel sizes use the responsive token system (no hard-coded 1440 px).
 */
export function ASRHero(): React.ReactElement {
  return (
    <section
      data-section="ASRHero"
      className="relative overflow-hidden"
      style={{
        // Figma gradient (verbatim): 179.99deg navy → blue → purple → fade-out.
        background:
          "linear-gradient(179.99deg, #151021 -25.7%, #10123E 31.16%, #131E8F 51.01%, #471EC0 68.71%, #471FC3 79.83%, rgba(70, 30, 191, 0.85) 85.02%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 98.92%)",
        minHeight: "clamp(560px, 51vw, 824px)",
      }}
    >
      {/* Figma-exact hero grid + blurred-ellipse glows (Figma node 783:119).
          Single SVG asset: 1440×569, contains grid mask + top-right purple
          ellipse + bottom-left larger ellipse + 3 accent lines. Fills the
          section width responsively (preserveAspectRatio xMidYMid slice). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/hero-grid.svg"
        alt=""
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="async"
      />

      {/* Bottom purple-to-transparent fade so the hero glides into the next
          section instead of cutting hard at the section edge. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute bottom-0 left-0 right-0"
        style={{
          height: "180px",
          background:
            "linear-gradient(180deg, rgba(71,30,192,0) 0%, rgba(120,60,255,0.35) 100%)",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col lg:flex-row items-start lg:items-center"
          style={{
            paddingTop: "clamp(96px, 11vw, 160px)",
            paddingBottom: "clamp(56px, 7vw, 100px)",
            gap: "40px",
          }}
        >
          {/* Left: copy — heading + body + CTA */}
          <div className="flex-1" style={{ maxWidth: "545px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 4.45vw, 64px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "white",
              }}
            >
              <span className="block">Bigger Images,</span>
              <span className="cs-text-gradient-impact">Bigger Risk</span>
            </h1>

            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(18px, 1.7vw, 24px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                color: "rgba(255, 255, 255, 0.8)",
                marginTop: "24px",
              }}
            >
              CleanStart Images reduce attack surface by eliminating
              unnecessary components before they enter production.
            </p>

            {/* CTA — shared .cs-btn-glass utility (matches every other hero) */}
            <Link
              href="/cleanstart-images"
              className="cs-btn-glass"
              style={
                {
                  marginTop: "40px",
                  "--cs-btn-px": "18px",
                  "--cs-btn-fs": "18px",
                } as React.CSSProperties
              }
            >
              Explore Cleanstart Images
              <svg
                className="cs-cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Right: two separate BLOATED + CLEAN cards side by side.
              Figma exports each card as its own asset so colours, glows
              and badge overlays render at full fidelity. */}
          {/* Cards-wrapper.
              Width clamps with explicit floor + ceiling so the wrapper has a
              predictable, proportional size at every desktop viewport from
              1024 → 1440+. Internal layout (60/40 split, column-gap, bottom
              alignment) is all relative to the wrapper width — nothing
              hard-coded — so the cards' position and proportions are
              perfectly preserved at every breakpoint in the desktop band. */}
          <div
            className="hidden lg:grid relative shrink-0"
            style={{
              width: "clamp(340px, 32vw, 460px)",
              /* Math: natural aspects H/W are 1.337 (BLOATED 662×885) and
                 1.203 (CLEAN 602×724). For CLEAN_h = 0.85 × BLOATED_h:
                 CLEAN_w = BLOATED_w × (1.337 × 0.85) / 1.203 ≈ 0.944 × BLOATED_w.
                 With a 4% gap: BLOATED 49.4% + CLEAN 46.6% + gap 4% = 100%. */
              gridTemplateColumns: "49.4% 46.6%",
              alignItems: "end",
              columnGap: "4%",
            }}
          >
            {/* BLOATED card — larger, sits at row baseline. */}
            <Image
              src="/images/attack-surface-reduction/hero-card-bloated.png"
              alt="BLOATED image: 1.2 GB · 247 packages · 89 HIGH CVEs"
              width={662}
              height={885}
              sizes="(min-width: 1440px) 270px, 19vw"
              className="block w-full h-auto"
              priority
            />
            {/* CLEAN card — smaller (≈70% of BLOATED), bottom edge aligns
                with BLOATED via grid align-items: end. */}
            <Image
              src="/images/attack-surface-reduction/hero-card-clean.png"
              alt="CLEAN image: 87 MB · 12 packages · 0 HIGH CVEs"
              width={602}
              height={724}
              sizes="(min-width: 1440px) 180px, 13vw"
              className="block w-full h-auto"
              priority
            />
          </div>

          {/* Mobile-only: same 49.4/46.6 grid so CLEAN renders at 85% of
              BLOATED's height (matches desktop layout exactly). */}
          <div
            className="grid lg:hidden relative w-full"
            style={{
              gridTemplateColumns: "49.4% 46.6%",
              alignItems: "end",
              columnGap: "4%",
            }}
          >
            <Image
              src="/images/attack-surface-reduction/hero-card-bloated.png"
              alt="BLOATED image: 1.2 GB · 247 packages · 89 HIGH CVEs"
              width={662}
              height={885}
              sizes="51vw"
              className="block w-full h-auto"
              priority
            />
            <Image
              src="/images/attack-surface-reduction/hero-card-clean.png"
              alt="CLEAN image: 87 MB · 12 packages · 0 HIGH CVEs"
              width={602}
              height={724}
              sizes="45vw"
              className="block w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
