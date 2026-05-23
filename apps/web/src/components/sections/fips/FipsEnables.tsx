import Image from "next/image";
import { Section, Container } from "@/components/layout";

/**
 * "How CleanStart Enables FIPS 140-3 Compliance" — Figma node 787:2093.
 *
 * Composition:
 *   • Wheel visual = single PNG exported from Figma node 787:2100
 *     (donut, wedges with gradients/glows, inner light-blue ring,
 *     center dark core — all baked in). Lives at /images/fips/hub-wheel.png.
 *   • All text (numbers 01-07, capability labels, "Validated Foundation") is
 *     real, selectable HTML on top of the image. The text is positioned with
 *     percentages of the wheel box and sized with container queries (`cqi`),
 *     so each piece is locked to the wheel — it scales with the image at
 *     every viewport. The HTML text sits over the burned-in text in the PNG
 *     at the exact same coordinates, so the visible text becomes the
 *     sharp, selectable HTML version.
 *
 * Surrounding chrome (heading, subhead, padding, container, flares) uses
 * the project's design tokens (`--color-cs-*`, `--text-*`, `--spacing-*`)
 * and primitives (<Section>, <Container>).
 */

/* ---------- Figma hub geometry (used to compute % positions) ---------- */
const HUB_W = 932.26;
const HUB_H = 896.08;

/** Wheel PNG native dimensions (Figma export at 2× includes a few px of bleed). */
const HUB_PNG_W = 1773;
const HUB_PNG_H = 1793;

/** Wheel display cap — Figma node 787:2100 is 932.26 px, expressed in rem. */
const HUB_MAX_REM = "58.27rem"; // 932.26 / 16

/**
 * Wheel slices. Each row maps to a wedge in clockwise order from 12 o'clock.
 * Positions and sizes are the Figma TEXT-BOX rects (top-left + size) for the
 * burned-in number and label inside that wedge — taken verbatim from
 * the hub group (787:2107) layout data so the overlay sits exactly on top
 * of the burned-in artwork.
 */
const SLICES: ReadonlyArray<{
  num: string;
  label: string;
  numX: number;
  numY: number;
  numW: number;
  numH: number;
  labelX: number;
  labelY: number;
  labelW: number;
  labelH: number;
}> = [
  { num: "01", label: "Build Integrity",         numX: 499.18, numY: 102, numW: 27, numH: 36, labelX: 503.18, labelY: 175, labelW: 145, labelH: 72 },
  { num: "02", label: "Runtime Security",        numX: 737.18, numY: 271, numW: 32, numH: 36, labelX: 651.18, labelY: 354, labelW: 151, labelH: 72 },
  { num: "03", label: "Compliance Automation",   numX: 764.18, numY: 553, numW: 32, numH: 36, labelX: 597.18, labelY: 590, labelW: 159, labelH: 72 },
  { num: "04", label: "Crypto Validation",       numX: 550.18, numY: 770, numW: 33, numH: 36, labelX: 399.18, labelY: 698, labelW: 127, labelH: 72 },
  { num: "05", label: "Hardened Configurations", numX: 252.18, numY: 726, numW: 33, numH: 36, labelX: 146.18, labelY: 582, labelW: 191, labelH: 72 },
  { num: "06", label: "Secure Deployment",       numX: 102.18, numY: 477, numW: 34, numH: 36, labelX: 110.18, labelY: 352, labelW: 159, labelH: 72 },
  { num: "07", label: "Continuous Monitoring",   numX: 205.18, numY: 190, numW: 32, numH: 36, labelX: 255.18, labelY: 167, labelW: 165, labelH: 72 },
];

/** Center "Validated Foundation" text-box from Figma (Manrope SemiBold 32 px). */
const CENTER_LABEL = { x: 378.18, y: 422, w: 164, h: 70 };

/** Convert a top-left px rect in the Figma hub box to CSS top/left/width/height %. */
function rectToPct(x: number, y: number, w: number, h: number) {
  return {
    left: `${(x / HUB_W) * 100}%`,
    top: `${(y / HUB_H) * 100}%`,
    width: `${(w / HUB_W) * 100}%`,
    height: `${(h / HUB_H) * 100}%`,
  };
}

export function FipsEnables(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="FipsEnables"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62%, #471ec0 100%)",
      }}
    >
      {/* ---------- Ambient flares (md+) ---------- */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-top-right.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "clamp(0px, 1.5%, 1.5rem)",
          top: "1.25rem",
          width: "clamp(11.25rem, 22%, 20.5rem)",
          height: "auto",
          mixBlendMode: "screen",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-left.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: 0,
          top: "39%",
          width: "clamp(10rem, 18.5%, 16.8125rem)",
          height: "auto",
          mixBlendMode: "screen",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-bottom.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "min(88%, 80rem)",
          height: "auto",
          mixBlendMode: "screen",
        }}
        loading="lazy"
        decoding="async"
      />

      <Container className="relative">
        {/* ---------- Heading + subhead (Figma 787:2097) ---------- */}
        <div
          className="mx-auto text-center"
          style={{
            maxWidth: "47rem", // Figma 752 / 16
            marginBottom: "clamp(2rem, 5vw, 3.25rem)",
          }}
        >
          <h2
            className="mx-auto text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "41.5rem",
              marginBottom: "clamp(1rem, 2.2vw, 2rem)",
            }}
          >
            How CleanStart Enables{" "}
            <span className="cs-text-gradient-impact">FIPS 140-3 Compliance</span>
          </h2>
          <p
            className="mx-auto text-white"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              opacity: 0.8,
            }}
          >
            CleanStart embeds validated cryptographic foundations directly into
            hardened container environments.
          </p>
        </div>

        {/* ---------- Wheel (Figma render as background) + selectable text overlay ---------- */}
        <HubWheel />
      </Container>
    </Section>
  );
}

function HubWheel(): React.ReactElement {
  const centerPos = rectToPct(
    CENTER_LABEL.x,
    CENTER_LABEL.y,
    CENTER_LABEL.w,
    CENTER_LABEL.h,
  );

  return (
    <div
      className="relative mx-auto"
      style={{
        width: "100%",
        maxWidth: `min(100%, ${HUB_MAX_REM})`,
        aspectRatio: `${HUB_PNG_W} / ${HUB_PNG_H}`,
        containerType: "inline-size",
      }}
    >
      {/* Wheel image — background visual. Selectable HTML text sits on top. */}
      <Image
        src="/images/fips/hub-wheel.png"
        alt=""
        aria-hidden
        width={HUB_PNG_W}
        height={HUB_PNG_H}
        sizes="(min-width: 1024px) 932px, (min-width: 640px) 90vw, calc(100vw - 48px)"
        className="absolute inset-0 block h-full w-full select-none"
        priority={false}
      />

      {/* Selectable text overlay — positions and sizes lock to the wheel via
          % + cqi so every label moves and scales with the image. */}
      <div className="absolute inset-0">
        {SLICES.map((s) => {
          const numRect = rectToPct(s.numX, s.numY, s.numW, s.numH);
          const lblRect = rectToPct(s.labelX, s.labelY, s.labelW, s.labelH);
          return (
            <div key={s.num}>
              {/* Number — Figma style_W3RXBI: Sora Bold 24px / 150% / -7% */}
              <span
                className="absolute flex items-start text-white"
                style={{
                  left: numRect.left,
                  top: numRect.top,
                  width: numRect.width,
                  height: numRect.height,
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(0.75rem, 2.57cqi, 1.5rem)", // 12 → 24 px
                  fontWeight: 700,
                  letterSpacing: "-0.07em",
                  lineHeight: 1.5,
                }}
              >
                {s.num}
              </span>

              {/* Label — Figma style_UHZRHP: Figtree SemiBold 28px / 130% / -1.32% */}
              <span
                className="absolute flex items-center justify-center text-center text-white"
                style={{
                  left: lblRect.left,
                  top: lblRect.top,
                  width: lblRect.width,
                  height: lblRect.height,
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(0.8125rem, 3cqi, 1.75rem)", // 13 → 28 px
                  fontWeight: 600,
                  letterSpacing: "-0.0132em",
                  lineHeight: 1.3,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}

        {/* Center label — Figma style_TX6HWE: Manrope SemiBold 32px / 110% / -4% */}
        <span
          className="absolute flex items-center justify-center text-center text-white"
          style={{
            left: centerPos.left,
            top: centerPos.top,
            width: centerPos.width,
            height: centerPos.height,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(0.9375rem, 3.43cqi, 2rem)", // 15 → 32 px
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            opacity: 0.85,
          }}
        >
          Validated Foundation
        </span>
      </div>
    </div>
  );
}
