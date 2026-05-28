import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

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

export function CisoComparison(): React.ReactElement {
  return (
    <section
      data-section="CisoComparison"
      className="relative w-full overflow-hidden bg-white"
      aria-labelledby="ciso-comparison-title"
    >

      {/* ══════════════════════════════════════════════════════════════════════
          Unified layout — same card style at every breakpoint, mirroring the
          homepage "Security isn't just patching" section. Cards stack vertically
          on mobile and switch to side-by-side from md+.
          Figma: 583:2481 (desktop) · 910:263 (mobile heading retained < sm)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="py-section-sm sm:py-section-md">
        <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">

          {/* Heading — mobile keeps the "Visibility Alone Doesn't Reduce Risk"
              copy; sm+ shifts to the desktop heading. */}
          <Reveal header className="text-center">
            <h2
              id="ciso-comparison-title"
              className="mx-auto sm:hidden"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
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
            <h2
              className="mx-auto hidden font-display text-[#111111] sm:block"
              style={{
                maxWidth: "min(737px, 100%)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              From Visibility to Actionable{" "}
              <span className="cs-text-gradient-impact">Risk Reduction</span>
            </h2>
          </Reveal>

          {/* Cards row — stacks on mobile, side-by-side from md+ (matches
              SecurityNotPatching on the homepage). VS badge sits centered on
              top, bridging the gap. */}
          <div className="relative mt-8 flex flex-col items-center gap-6 md:mt-[60px] md:flex-row md:justify-center md:gap-10">
            <DesktopCard kind="traditional" features={TRADITIONAL} />
            <DesktopCard kind="cleansight" features={CLEANSIGHT} />
            <DesktopVsBadge />
          </div>

        </div>
      </div>

    </section>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
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
              fontSize: "var(--fs-h3)",
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
                    fontSize: "var(--fs-body)",
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
