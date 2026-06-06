import Image from "next/image";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The wheel is a single decorative PNG (`/images/fips/hub-wheel.webp`) with no
 * baked-in text. Capability labels and the center "Validated Foundation" label
 * are selectable HTML overlaid on top, positioned as % rects and sized with
 * container queries (`cqi`) so each label locks to the wheel and scales with it.
 */

const HUB_W = 932.26;
const HUB_H = 896.08;

/** Wheel PNG native dimensions (the 2× export includes a few px of bleed). */
const HUB_PNG_W = 1773;
const HUB_PNG_H = 1793;

/**
 * Wheel display cap. The wheel is the visual focus of the section and must fit
 * in the viewport without scrolling once in view, so width is bound by the
 * tighter of two caps via `min()`: the fixed desktop width, and a viewport-height
 * cap derived from the height left after reserving room for nav + heading,
 * projected through the PNG's aspect ratio.
 */
const HUB_MAX_REM = "58.27rem";
const HUB_HEIGHT_RESERVE_REM = "14rem";
const HUB_MAX_WIDTH_CSS = `min(${HUB_MAX_REM}, calc((100svh - ${HUB_HEIGHT_RESERVE_REM}) * ${HUB_PNG_W} / ${HUB_PNG_H}))`;

/**
 * Wheel slices in clockwise order from 12 o'clock. Each entry holds the
 * top-left position and size of the label rect inside that wedge.
 */
const SLICES: ReadonlyArray<{
  label: string;
  labelX: number;
  labelY: number;
  labelW: number;
  labelH: number;
}> = [
  // Top- and bottom-arc labels carry a small labelX nudge so the text tracks
  // each wedge's angular center rather than its raw rect origin.
  { label: "Build Integrity",         labelX: 511.18, labelY: 175, labelW: 145, labelH: 72 },
  { label: "Runtime Security",        labelX: 676.18, labelY: 354, labelW: 151, labelH: 72 },
  { label: "Compliance Automation",   labelX: 622.18, labelY: 590, labelW: 159, labelH: 72 },
  { label: "Crypto Validation",       labelX: 405.18, labelY: 698, labelW: 127, labelH: 72 },
  { label: "Hardened Configurations", labelX: 166.18, labelY: 582, labelW: 191, labelH: 72 },
  { label: "Secure Deployment",       labelX: 110.18, labelY: 352, labelW: 159, labelH: 72 },
  { label: "Continuous Monitoring",   labelX: 255.18, labelY: 167, labelW: 165, labelH: 72 },
];

/** Center "Validated Foundation" label rect, centered on the wheel's midpoint. */
const CENTER_LABEL = { x: 384.13, y: 413.04, w: 164, h: 70 };

/** Convert a top-left px rect in the hub box to CSS top/left/width/height %. */
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
      padding="sm"
      data-section="FipsEnables"
      className="relative overflow-hidden !pt-6 md:!pt-8"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62%, #471ec0 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-top-right.webp"
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
        src="/images/fips/flare-left.webp"
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
        src="/images/fips/flare-bottom.webp"
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
        <div
          className="mx-auto text-center"
          style={{
            maxWidth: "47rem",
            marginBottom: "clamp(1rem, 2vw, 1.5rem)",
          }}
        >
          <Reveal header>
            <h2
              className="mx-auto text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
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
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              className="mx-auto text-white"
              style={{
                fontFamily: "var(--font-sans)",
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
          </Reveal>
        </div>

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
      <Image
        src="/images/fips/hub-wheel.webp"
        alt=""
        aria-hidden
        width={HUB_PNG_W}
        height={HUB_PNG_H}
        sizes="(min-width: 1024px) 932px, (min-width: 640px) 90vw, calc(100vw - 48px)"
        className="absolute inset-0 block h-full w-full select-none"
        priority={false}
      />

      <div className="absolute inset-0">
        {SLICES.map((s) => {
          const lblRect = rectToPct(s.labelX, s.labelY, s.labelW, s.labelH);
          return (
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
         * Anchored to the dark inner-circle's visual center on the PNG, not the
         * geometric center: the PNG was exported with uneven bleed, so a pixel
         * scan puts the inner circle's center at (51.49%, 50.86%). Because the
         * container's aspect ratio matches the PNG, that maps 1:1 to container %.
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
            fontSize: "clamp(0.9375rem, 3.43cqi, 2rem)",
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
