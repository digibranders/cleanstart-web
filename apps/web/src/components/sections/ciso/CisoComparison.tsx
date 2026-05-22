import Image from "next/image";
import type React from "react";

/*
 * Figma node 583:2481 — 1920×924 px
 *
 * Background: white
 * Heading: 62px Manrope Bold, #111, tracking -0.05em, w=737px, centered, lh=1
 *   — "Risk Reduction" gets purple→cyan gradient fill (102.22deg)
 *   — paddingTop: 80px
 * Two comparison cards (602×571px each), gap=52px, rounded-[32px]
 *   Container: 1276px − 2×10px = 1256px → 602+52+602 = 1256 ✓
 * Left card:  "Traditional Security Operations" — gradient bg + gear icon items (fontWeight 600)
 * Right card: "CleanStart + CleanSight"         — gradient bg + check icon items (fontWeight 700)
 *   Right card additionally has hexagon vector overlay (comp-hex-vector.svg, soft-light)
 * VS badge: comp-vs-badge.png, 126×126, centered between cards, top=245px in inner div
 * Cyan glow: 622×529px solid rgb(44,193,235), opacity 0.4, rounded-[40px]
 *   Left glow: frame left=322, left card frame left=332 → glow at left=-10px in inner div
 *   Right glow: frame right=1598, right card frame right=1588 → glow at right=-10px in inner div
 * Flare (光斑): 630.75×177.4px teal radial glow
 *   Positioned at left=-99.62px, top=-43.38px relative to each card (masked to card bounds)
 *
 * Card anatomy (602×571):
 *   - Header dark area: 0–130px (gradient bg + gradient overlay + flare)
 *   - White panel: top=130px, h=370px → bottom at 500px, border-radius=32px
 *   - Dark footer: 500–571px (gradient bg visible below white panel)
 *   - Items: left=170px top=64px gap=40px within white panel; icon–text gap=24px
 */

const TRADITIONAL = [
  "Excessive vulnerability findings",
  "Large dependency trees",
  "Continuous remediation backlogs",
  "Limited remediation prioritization",
];

const CLEANSIGHT = [
  "Cleaner software foundations",
  "Contextualized risk insights",
  "Focused remediation priorities",
  "Reduced operational overhead",
];

const WHITE_BODY_SHADOW =
  "0px 120px 120px 0px rgba(223,155,255,0.08)," +
  "0px 64px 64px 0px rgba(22,34,51,0.12)," +
  "0px 32px 32px 0px rgba(22,34,51,0.04)," +
  "0px 24px 24px 0px rgba(22,34,51,0.04)," +
  "0px 4px 24px 0px rgba(22,34,51,0.04)," +
  "0px 4px 4px 0px rgba(22,34,51,0.04)";

const HEADER_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)";

function Card({
  title,
  items,
  gradientSrc,
  iconSrc,
  fontWeight,
  showVector = false,
}: {
  title: string;
  items: string[];
  gradientSrc: string;
  iconSrc: string;
  fontWeight: number;
  showVector?: boolean;
}): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: "602px",
        height: "571px",
        borderRadius: "32px",
        clipPath: "inset(0 round 32px)",
      }}
    >
      {/* Dark gradient bg — fills entire card */}
      <div className="absolute inset-0" style={{ background: HEADER_GRADIENT }} />

      {/* Gradient overlay — 1028×1028 radial, positioned so its center sits
          in the header zone; mask fades it out before the white panel */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src={gradientSrc}
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          left: "-113px",
          top: "-229px",
          width: "1028px",
          height: "1028px",
          maxWidth: "none",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 359px, transparent 429px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 359px, transparent 429px)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Flare (光斑) — teal radial glow at header/body junction
          Figma: 630.75×177.4px at left=-99.62px, top=-43.38px relative to card.
          The card's overflow:hidden clips this to the visible card area. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/comp-flare.svg"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          left: "-100px",
          top: "-43px",
          width: "631px",
          height: "355px",
          maxWidth: "none",
          objectFit: "fill",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Right card only: hexagon/geometric vector pattern (244×241, soft-light) */}
      {showVector && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden
          src="/images/ciso/comp-hex-vector.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "404px",
            top: "-13px",
            width: "244px",
            height: "241px",
            mixBlendMode: "soft-light",
          }}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Card header title — centered in the 130px dark header zone */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: "0px", left: "0px", right: "0px", height: "130px" }}
      >
        <h3
          className="relative z-10 text-white text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(16px, 1.67vw, 32px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            padding: "0 32px",
          }}
        >
          {title}
        </h3>
      </div>

      {/* White body panel — starts at 130px, height 370px → bottom at 500px
          The 71px gap (500–571) shows the dark footer gradient */}
      <div
        className="absolute bg-white overflow-hidden"
        style={{
          top: "130px",
          left: "0px",
          right: "0px",
          height: "370px",
          borderRadius: "32px",
          boxShadow: WHITE_BODY_SHADOW,
        }}
      >
        {/* Items list — left=170px, top=64px within white panel, gap=40px */}
        <div
          className="absolute flex flex-col"
          style={{ left: "170px", top: "64px", gap: "40px" }}
        >
          {items.map((item) => (
            <div key={item} className="flex items-center" style={{ gap: "24px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconSrc}
                alt=""
                aria-hidden
                style={{ width: "24px", height: "24px", flexShrink: 0 }}
                loading="lazy"
                decoding="async"
              />
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(14px, 1.15vw, 22px)",
                  fontWeight,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.4,
                  color: "#333",
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CisoComparison(): React.ReactElement {
  return (
    <section
      data-section="CisoComparison"
      className="relative overflow-hidden bg-white"
    >
      {/* Heading */}
      <div
        className="relative mx-auto text-center"
        style={{
          maxWidth: "1276px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "80px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#111",
            maxWidth: "737px",
            margin: "0 auto",
          }}
        >
          From Visibility to Actionable{" "}
          <span
            style={{
              background:
                "linear-gradient(102.22deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Risk Reduction
          </span>
        </h2>
      </div>

      {/* ════════════ DESKTOP cards ════════════
           Container: 1276px − 2×10px padding = 1256px inner
           Card math: 602 + 52 (gap) + 602 = 1256 → gap is exactly 52px ✓
           Glow math: glow 622px = card 602px + 10px each side
             Left glow: frame left=322, inner div left=332 → glow at left=-10px
             Right glow: frame right=1598, inner div right=1588 → glow at right=-10px */}
      <div
        className="hidden xl:block relative mx-auto"
        style={{
          maxWidth: "1276px",
          paddingLeft: "10px",
          paddingRight: "10px",
          paddingTop: "64px",
          paddingBottom: "100px",
        }}
      >
        <div className="relative" style={{ height: "582px" }}>
          {/* ── Cyan glow — left card ──
               Figma 583:2517: solid rgb(44,193,235), 622×529px, opacity 0.4, rounded-[40px]
               Glow left=322 in 1920px frame, inner div left=332 → glow at left=-10px
               Glow top=284 in frame, inner div top=284 → top=0 in inner div */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: "-10px",
              top: "0px",
              width: "622px",
              height: "529px",
              borderRadius: "40px",
              opacity: 0.4,
              background: "rgb(44, 193, 235)",
            }}
          />

          {/* ── Cyan glow — right card ──
               Glow right=322 from frame right → glow at right=-10px in inner div */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              right: "-10px",
              top: "0px",
              width: "622px",
              height: "529px",
              borderRadius: "40px",
              opacity: 0.4,
              background: "rgb(44, 193, 235)",
            }}
          />

          {/* Left card — top=11px (glow is 11px above card top) */}
          <div className="absolute" style={{ left: "0px", top: "11px" }}>
            <Card
              title="Traditional Security Operations"
              items={TRADITIONAL}
              gradientSrc="/images/ciso/comp-gradient-left.png"
              iconSrc="/images/ciso/comp-icon-gear.svg"
              fontWeight={600}
            />
          </div>

          {/* Right card */}
          <div className="absolute" style={{ right: "0px", top: "11px" }}>
            <Card
              title="CleanStart + CleanSight"
              items={CLEANSIGHT}
              gradientSrc="/images/ciso/comp-gradient-right.png"
              iconSrc="/images/ciso/comp-icon-check.svg"
              fontWeight={700}
              showVector
            />
          </div>

          {/* VS badge — centered horizontally, top=245px
               Frame: left=897, top=529; inner div origin: left=332, top=284
               → x: badge center at frame 960 = 50% of inner div (1256/2=628 → frame 332+628=960) ✓
               → y: 529-284=245px ✓ */}
          <div
            className="absolute z-10"
            style={{
              left: "50%",
              top: "245px",
              transform: "translate(-50%, 0)",
              width: "126px",
              height: "126px",
            }}
          >
            <Image
              src="/images/ciso/comp-vs-badge.png"
              alt="VS"
              fill
              className="object-contain"
              sizes="126px"
            />
          </div>
        </div>
      </div>

      {/* ════════════ MOBILE cards ════════════ */}
      <div
        className="xl:hidden relative mx-auto max-w-[var(--container-default)] px-4 sm:px-6"
        style={{ paddingTop: "48px", paddingBottom: "60px" }}
      >
        {/* Traditional card */}
        <div className="overflow-hidden" style={{ borderRadius: "32px", marginBottom: "32px" }}>
          <div
            className="relative flex items-center justify-center"
            style={{ height: "90px", overflow: "hidden", background: HEADER_GRADIENT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/ciso/comp-gradient-left.png"
              alt=""
              className="absolute inset-0 pointer-events-none select-none"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
              decoding="async"
            />
            <h3
              className="relative z-10 text-white text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(14px, 4vw, 24px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                padding: "0 16px",
              }}
            >
              Traditional Security Operations
            </h3>
          </div>
          <div className="bg-white flex flex-col" style={{ padding: "32px 28px", gap: "24px" }}>
            {TRADITIONAL.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "16px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/ciso/comp-icon-gear.svg"
                  alt=""
                  aria-hidden
                  style={{ width: "24px", height: "24px", flexShrink: 0 }}
                  loading="lazy"
                  decoding="async"
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 3.5vw, 20px)",
                    fontWeight: 600,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.4,
                    color: "#333",
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center py-4">
          <Image
            src="/images/ciso/comp-vs-badge.png"
            alt="VS"
            width={80}
            height={80}
            sizes="80px"
            className="object-contain"
          />
        </div>

        {/* CleanStart + CleanSight card */}
        <div className="overflow-hidden" style={{ borderRadius: "32px", marginTop: "32px" }}>
          <div
            className="relative flex items-center justify-center"
            style={{ height: "90px", overflow: "hidden", background: HEADER_GRADIENT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/ciso/comp-gradient-right.png"
              alt=""
              className="absolute inset-0 pointer-events-none select-none"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
              decoding="async"
            />
            <h3
              className="relative z-10 text-white text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(14px, 4vw, 24px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                padding: "0 16px",
              }}
            >
              CleanStart + CleanSight
            </h3>
          </div>
          <div className="bg-white flex flex-col" style={{ padding: "32px 28px", gap: "24px" }}>
            {CLEANSIGHT.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "16px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/ciso/comp-icon-check.svg"
                  alt=""
                  aria-hidden
                  style={{ width: "24px", height: "24px", flexShrink: 0 }}
                  loading="lazy"
                  decoding="async"
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 3.5vw, 20px)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.4,
                    color: "#333",
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
