import Image from "next/image";

/**
 * Figma node 583:2481 — desktop
 * Figma node 910:263  — mobile (360×~750px)
 *
 * ── MOBILE (< sm) ────────────────────────────────────────────────────────────
 * Background: white section
 * Heading: 28px Manrope Bold, centered, maxW 264px, lh 1.2
 *   "Visibility Alone Doesn't " → #111
 *   "Reduce Risk" → gradient 98.05deg #9A51FF 71.726% → #2CC1EB 98.781%
 * Two cards stacked, gap 16px, each 328px wide centered
 *   Card: border-radius 17.435px, overflow hidden
 *   Background: linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)
 *   Header (h=85px): dark, centered title 20px Bold white tracking-1px
 *     Hex/vector watermark: mix-blend-soft-light, right side
 *     Teal flare at bottom: mix-blend-plus-lighter, comp-flare.svg
 *   Body (white): comp-gradient-left/right.png overlay, list items gap 16px
 *     Icons: comp-icon-gear.svg (12.672px) / comp-icon-check.svg
 *     Text: 16px Manrope Medium/SemiBold, #333, tracking -0.8px (-0.05em), lh 1.4
 * VS badge: comp-vs-badge.png 87×87px, absolute centered between cards
 * Card outer shadow: multi-layer CSS shadow + subtle purple glow
 *
 * ── DESKTOP (≥ sm) ───────────────────────────────────────────────────────────
 * Heading: "From Visibility to Actionable Risk Reduction", clamp(32px,4vw,56px)
 * Cards: outer radius 40, cyan #2CC1EB border via padding 10, inner radius 32
 * Header: clamp(76px,7vw,100px) dark→purple gradient, cyan flare at bottom
 * Body: white flex-1, two soft radial blobs
 * VS badge: centered between cards, clamp(72px,11vw,160px)
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

// Multi-layer shadow replicating comp-card-mask.svg drop shadows + purple bottom glow
const MOBILE_CARD_SHADOW = [
  "0px 4px 4px 0px rgba(22,34,51,0.04)",
  "0px 4px 24px 0px rgba(22,34,51,0.04)",
  "0px 24px 24px 0px rgba(22,34,51,0.04)",
  "0px 32px 32px 0px rgba(22,34,51,0.04)",
  "0px 64px 64px 0px rgba(22,34,51,0.12)",
  "0px 120px 120px 0px rgba(223,155,255,0.08)",
].join(", ");

export function CisoComparison(): React.ReactElement {
  return (
    <section
      data-section="CisoComparison"
      className="relative w-full overflow-hidden bg-white"
      aria-labelledby="ciso-comparison-title"
    >

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE — stacked cards with dark gradient style (< sm = 640px)
          Figma node 910:263
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden" style={{ paddingTop: "40px", paddingBottom: "48px" }}>

        {/* Heading — "Visibility Alone Doesn't Reduce Risk" */}
        <h2
          id="ciso-comparison-title"
          className="text-center mx-auto px-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-md)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "264px",
            marginBottom: "24px",
          }}
        >
          <span style={{ color: "#111" }}>{"Visibility Alone Doesn't "}</span>
          <span
            style={{
              backgroundImage:
                "linear-gradient(98.05deg, #9A51FF 71.726%, #2CC1EB 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Reduce Risk
          </span>
        </h2>

        {/* Cards container + VS badge */}
        <div className="relative mx-auto" style={{ maxWidth: "340px", padding: "0 6px" }}>

          {/* Card 1 — Traditional */}
          <MobileCard kind="traditional" features={TRADITIONAL} />

          {/* 16px gap */}
          <div style={{ height: "16px" }} />

          {/* Card 2 — CleanStart */}
          <MobileCard kind="cleansight" features={CLEANSIGHT} />

          {/* VS badge — centered in the gap between cards (87×87px) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              /* First card height (309px) - half badge (43.5px) + half gap (8px) = 273.5px */
              top: "273.5px",
              transform: "translateX(-50%)",
              width: "87px",
              height: "87px",
              zIndex: 30,
            }}
          >
            <Image
              src="/images/ciso/comp-vs-badge.png"
              alt=""
              width={87}
              height={87}
              sizes="87px"
              className="h-full w-full object-contain"
            />
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP — side-by-side cyan-border cards (≥ sm = 640px)
          Figma node 583:2481
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block py-section-md">
        <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">

          {/* Heading */}
          <div className="text-center">
            <h2
              className="mx-auto font-display text-[#111111]"
              style={{
                maxWidth: "min(737px, 100%)",
                fontSize: "var(--text-display-md)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              From Visibility to Actionable{" "}
              <span className="cs-text-gradient-impact">Risk Reduction</span>
            </h2>
          </div>

          {/* Vertical fading-gray separator (decorative) */}
          <div
            aria-hidden
            className="mx-auto mt-6 hidden h-[90px] w-px md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(217,217,217,1) 47.2%, rgba(217,217,217,0) 100%)",
            }}
          />

          {/* Cards row */}
          <div className="relative mt-12 flex flex-col items-center gap-6 md:mt-[60px] md:flex-row md:justify-center md:gap-10">
            <DesktopCard kind="traditional" features={TRADITIONAL} />
            <DesktopCard kind="cleansight" features={CLEANSIGHT} />
            <DesktopVsBadge />
          </div>

        </div>
      </div>

    </section>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({
  kind,
  features,
}: {
  kind: "traditional" | "cleansight";
  features: string[];
}): React.ReactElement {
  const isTraditional = kind === "traditional";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "17.435px",
        overflow: "hidden",
        /* Figma card height = 309px; header = 85px; white body ≈ 184px; dark gradient at bottom ≈ 40px */
        minHeight: "309px",
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
        boxShadow: MOBILE_CARD_SHADOW,
      }}
    >
      {/* ── Hex / vector watermark — mix-blend-mode soft-light ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src={
          isTraditional
            ? "/images/ciso/comp-hex-vector.svg"
            : "/images/ciso/comp-vector.svg"
        }
        alt=""
        className="absolute pointer-events-none select-none"
        style={{ right: "-30px", top: "-8px", width: "152px", height: "150px" }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Teal flare at header/body boundary — mix-blend-plus-lighter ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-7px",
          top: "63px",
          width: "343px",
          height: "96px",
          mixBlendMode: "plus-lighter",
          backgroundImage: "url('/images/ciso/comp-flare.svg')",
          backgroundSize: "100% 100%",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* ── Header — dark area, title centered ── */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          height: "85px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-card-title-md)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#fff",
            textAlign: "center",
          }}
        >
          {isTraditional ? "Traditional Security Operations" : "CleanStart"}
        </h3>
      </div>

      {/* ── Body — white bg, radial gradient glows, list items ── */}
      <div
        style={{
          position: "relative",
          background: "#fff",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Cyan glow — top-left (matches Figma ellipse 2 at left:-120px top:~1px) */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "-100px",
            top: "-60px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: isTraditional ? "#2CC1EB" : "#4FC3F7",
            opacity: isTraditional ? 0.1 : 0.13,
            filter: "blur(50px)",
          }}
        />

        {/* Purple glow — bottom-right (matches Figma ellipse 1 at right:~27px top:~47px of body) */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            right: "-40px",
            bottom: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "#DF9BFF",
            opacity: 0.16,
            filter: "blur(40px)",
          }}
        />

        {/* List items */}
        <ul
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            /* top 24px matches Figma: list starts 24px below white-body top edge */
            padding: "24px 24px 22px",
          }}
        >
          {features.map((label) => (
            <li
              key={label}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              {isTraditional ? (
                <Image
                  src="/images/ciso/comp-icon-gear.svg"
                  alt=""
                  width={13}
                  height={13}
                  sizes="13px"
                  style={{ width: "12.672px", height: "12.672px", flexShrink: 0 }}
                />
              ) : (
                /* Check/sparkle icon: Figma h=14px w=16.404px */
                <div
                  style={{ position: "relative", flexShrink: 0, width: "16.404px", height: "14px" }}
                >
                  <Image
                    src="/images/ciso/comp-icon-check.svg"
                    alt=""
                    fill
                    sizes="17px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              )}
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-body-md)",
                  fontWeight: isTraditional ? 500 : 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  color: "#333",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Desktop card ─────────────────────────────────────────────────────────────
function DesktopCard({
  kind,
  features,
}: {
  kind: "traditional" | "cleansight";
  features: string[];
}): React.ReactElement {
  const isTraditional = kind === "traditional";

  return (
    <div
      className="relative flex h-full w-full flex-col lg:max-w-[500px]"
      style={{
        borderRadius: 40,
        background: "#2CC1EB",
        padding: 10,
        zIndex: 10,
      }}
    >
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ borderRadius: 32 }}
      >
        {/* Header */}
        <div
          className="relative flex h-[clamp(76px,7vw,100px)] w-full items-center justify-center overflow-hidden"
          style={{
            background: isTraditional
              ? "linear-gradient(135deg, #151021 0%, #1A1733 60%, #221A3D 100%)"
              : "linear-gradient(135deg, #1B0E33 0%, #2B1456 40%, #471EC0 100%)",
          }}
        >
          {isTraditional ? (
            <Image
              aria-hidden
              src="/images/security/header-cube.svg"
              alt=""
              width={162}
              height={186}
              sizes="162px"
              className="pointer-events-none absolute mix-blend-soft-light"
              style={{ right: "-37px", top: "-13px", width: "162px", height: "186.4px", opacity: 0.7 }}
            />
          ) : (
            <Image
              aria-hidden
              src="/images/security/header-chevron.svg"
              alt=""
              width={258}
              height={236}
              sizes="258px"
              className="pointer-events-none absolute mix-blend-soft-light"
              style={{ right: "-120px", top: "-2px", width: "258px", height: "236px", opacity: 0.7 }}
            />
          )}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px]"
            style={{
              background:
                "radial-gradient(60% 140% at 50% 100%, rgba(44,193,235,0.65) 0%, rgba(44,193,235,0.25) 35%, rgba(44,193,235,0) 70%)",
              filter: "blur(6px)",
            }}
          />

          <h3
            className="relative z-10 text-center font-display text-white"
            style={{
              fontSize: "var(--text-card-title-lg)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              padding: "0 16px",
            }}
          >
            {isTraditional ? "Traditional Security Operations" : "CleanStart + CleanSight"}
          </h3>
        </div>

        {/* White body */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden bg-white py-[clamp(24px,2.5vw,36px)]"
          style={{ minHeight: "clamp(260px, 22vw, 340px)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{ right: -40, bottom: -50, width: 262, height: 262, borderRadius: "50%", background: "#DF9BFF", opacity: 0.18, filter: "blur(40px)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{ left: -100, top: 30, width: 364, height: 364, borderRadius: "50%", background: "#2CC1EB", opacity: 0.1, filter: "blur(60px)" }}
          />

          <ul className="relative z-10 mx-auto flex h-full max-w-[400px] flex-col justify-center gap-[clamp(20px,2.5vw,36px)]">
            {features.map((label) => (
              <li key={label} className="flex items-center gap-6">
                <Image
                  src={
                    isTraditional
                      ? "/images/ciso/comp-icon-gear.svg"
                      : "/images/ciso/comp-icon-check.svg"
                  }
                  alt=""
                  width={24}
                  height={24}
                  sizes="24px"
                  className="h-6 w-6 shrink-0"
                />
                <span
                  className="text-[#333333]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-body-lg)",
                    fontWeight: isTraditional ? 500 : 600,
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop VS badge ─────────────────────────────────────────────────────────
function DesktopVsBadge(): React.ReactElement {
  const SIZE = "clamp(72px, 11vw, 160px)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: SIZE,
        aspectRatio: "1 / 1",
        zIndex: 30,
      }}
    >
      <Image
        src="/images/ciso/comp-vs-badge.png"
        alt=""
        width={252}
        height={252}
        sizes="200px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
