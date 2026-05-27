import Image from "next/image";
import { Section, Container } from "@/components/layout";

/**
 * "How CleanStart Enables FIPS 140-3 Compliance" — Figma node 787:2093.
 *
 * Composition:
 *   • Wheel visual = single PNG (`/images/fips/hub-wheel.png`) — pure
 *     decoration: donut, 8 wedges with gradients/glows, light-blue inner
 *     ring, center dark core. No text is baked into the PNG.
 *   • Capability labels + "Validated Foundation" are selectable HTML on
 *     top, positioned with Figma-coordinate text-box rects and sized with
 *     container queries (`cqi`) so each piece is locked to the wheel and
 *     scales with the image at every viewport.
 */

/* ---------- Figma hub geometry (used to compute % positions) ---------- */
const HUB_W = 932.26;
const HUB_H = 896.08;

/** Wheel PNG native dimensions (Figma export at 2× includes a few px of bleed). */
const HUB_PNG_W = 1773;
const HUB_PNG_H = 1793;

/**
 * Wheel display cap.
 *   • Figma spec: 932.26 px (58.27 rem) at desktop.
 *   • Viewport-height cap: the wheel is the visual focus of the section, so
 *     it must fully fit in the user's viewport without scrolling once the
 *     section is in view. Reserve ~14 rem (224 px) for the sticky nav and
 *     the heading block above the wheel, then derive the max width from
 *     the height-after-reserve via the PNG's aspect ratio (1773/1793 ≈ 0.989).
 *   • The two caps are combined with `min()` so width is bound by whichever
 *     dimension is tighter on the current viewport.
 */
const HUB_MAX_REM = "58.27rem"; // 932.26 / 16
const HUB_HEIGHT_RESERVE_REM = "14rem"; // nav + heading + breathing room
const HUB_MAX_WIDTH_CSS = `min(${HUB_MAX_REM}, calc((100svh - ${HUB_HEIGHT_RESERVE_REM}) * ${HUB_PNG_W} / ${HUB_PNG_H}))`;

/**
 * Wheel slices. Each row maps to a wedge in clockwise order from 12 o'clock.
 * Positions and sizes are the Figma TEXT-BOX rects (top-left + size) for the
 * label inside that wedge — taken verbatim from the hub group (787:2107)
 * layout data.
 */
const SLICES: ReadonlyArray<{
  label: string;
  labelX: number;
  labelY: number;
  labelW: number;
  labelH: number;
}> = [
  // Visual nudges applied to the top-arc + bottom-arc labels so the text
  // tracks the wedge's angular center (Figma's text-box rects sat a few px
  // left of the visual sweet spot):
  //   Build Integrity   → labelX +8
  //   Crypto Validation → labelX +6
  { label: "Build Integrity",         labelX: 511.18, labelY: 175, labelW: 145, labelH: 72 },
  { label: "Runtime Security",        labelX: 676.18, labelY: 354, labelW: 151, labelH: 72 },
  { label: "Compliance Automation",   labelX: 622.18, labelY: 590, labelW: 159, labelH: 72 },
  { label: "Crypto Validation",       labelX: 405.18, labelY: 698, labelW: 127, labelH: 72 },
  { label: "Hardened Configurations", labelX: 166.18, labelY: 582, labelW: 191, labelH: 72 },
  { label: "Secure Deployment",       labelX: 110.18, labelY: 352, labelW: 159, labelH: 72 },
  { label: "Continuous Monitoring",   labelX: 255.18, labelY: 167, labelW: 165, labelH: 72 },
];

/**
 * Center "Validated Foundation" text-box.
 * Centered on the wheel's geometric midpoint (HUB_W/2, HUB_H/2 = 466.13, 448.04):
 *   x = 466.13 - 164/2 = 384.13
 *   y = 448.04 -  70/2 = 413.04
 */
const CENTER_LABEL = { x: 384.13, y: 413.04, w: 164, h: 70 };

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
              /* Section heading bumped from --fs-h2 to --fs-h1 per typography QA round 2 */
              fontSize: "var(--fs-h1)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
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
              /* Mobile: 16px (Figma 366:7788), desktop: 24px */
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
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
        maxWidth: `min(100%, ${HUB_MAX_WIDTH_CSS})`,
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
          const lblRect = rectToPct(s.labelX, s.labelY, s.labelW, s.labelH);
          return (
            /* Label — Figma style_UHZRHP: Manrope SemiBold 28px / 130% / -1.32% */
            <span
              key={s.label}
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
          );
        })}

        {/*
         * Center label — Figma style_TX6HWE: Manrope SemiBold 32px / 110% / -4%.
         * Anchored to the dark inner-circle's visual center on the PNG, not
         * to the Figma hub-box geometric center. The PNG was exported with
         * uneven bleed (1773 × 1793), and a pixel scan of hub-wheel.png puts
         * the inner circle's center at (51.49%, 50.86%) of the PNG — which,
         * because the container's aspect-ratio matches the PNG, maps 1:1 to
         * container %. (Earlier 47.46% y was wrong — the strict "purple"
         * filter missed the dark-blue upper half of the inner circle.)
         */}
        <span
          className="absolute flex items-center justify-center text-center text-white"
          style={{
            left: "51.49%",
            top: "50.86%",
            width: centerPos.width,
            height: centerPos.height,
            transform: "translate(-50%, -50%)",
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
