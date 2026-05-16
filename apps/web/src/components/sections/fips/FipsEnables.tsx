/**
 * Figma frame 1:378 — section 1922 × 1310.
 *
 * Decorative flares (PNG with transparent corners):
 *   1:379 flare-top-right  x=1573 y=32   w=328  h=328
 *   1:380 flare-bottom     x=1601 y=951  w=1280 h=360   (extends past section)
 *   1:381 flare-left       x=-59  y=511  w=328  h=328   (extends past left edge)
 *
 * Heading group 1:382 — x=585 y=120 w=752 h=240
 *   title  x=629 y=120 w=664 h=124
 *   body   x=585 y=276 w=752 h=84
 *
 * Hub group 1:385 — x=454 y=412 w=1014 h=788  (contains orb + pills)
 *   hub orb (1:386)         local x=133 y=33  w=745 h=745
 *   center label (1:425)    local x=453 y=359 w=110 h=110
 *
 * Pill positions in the 1014×788 hub-group local space:
 *   Build Integrity         x=606 y=0
 *   Runtime Security        x=949 y=167
 *   Compliance Automation   x=1014 y=430
 *   Crypto Validation       x=746 y=680
 *   Hardened Configurations x=448 y=680
 *   Secure Deployment       x=180 y=430
 *   Continuous Monitoring   x=245 y=175
 */

interface HubPillData {
  label: string;
  /** Local x within 1014-wide hub group, in pixels. */
  x: number;
  /** Local y within 788-tall hub group, in pixels. */
  y: number;
}

const PILL_W = 180;
const PILL_H = 108;
const HUB_W = 1014;
const HUB_H = 788;

/**
 * Pill positions normalized for left/right symmetry around the orb center.
 *
 * Figma's raw coordinates are right-biased (5 pills right-of-center, 2 left).
 * To keep the visual hierarchy/labels Figma intended but balance the layout,
 * we redistribute 7 pills on an ellipse around the center at evenly spaced
 * angles (51.43° apart, gap at the top), so all pill CENTERS are mirrored
 * across the container's vertical axis at x = 507 (HUB_W / 2).
 *
 * Resulting symmetric pairs (centers around x=507):
 *   Build Integrity (688) ↔ Continuous Monitoring (326)
 *   Runtime Security (913) ↔ Secure Deployment (101)
 *   Compliance Automation (833) ↔ Hardened Configurations (181)
 *   Crypto Validation (507) — bottom center
 */
const PILLS: HubPillData[] = [
  { label: "Continuous Monitoring", x: 236, y: 34 },
  { label: "Build Integrity", x: 598, y: 34 },
  { label: "Runtime Security", x: 823, y: 264 },
  { label: "Compliance Automation", x: 743, y: 552 },
  { label: "Crypto Validation", x: 417, y: 680 },
  { label: "Hardened Configurations", x: 91, y: 552 },
  { label: "Secure Deployment", x: 11, y: 264 },
];

export function FipsEnables(): React.ReactElement {
  return (
    <section
      data-section="FipsEnables"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 67%, #471ec0 107%)",
        minHeight: "clamp(900px, 68.2vw, 1310px)",
      }}
    >
      {/* -------------------- Figma flare assets -------------------- */}
      {/* Top-right cyan flare (1:379) — 328×328 at section x=1573 y=32.
          Right edge sits ~21px from section right; we mirror that with
          right ≈ 1.09% of 1922. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-top-right.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "1.09%", // (1922-(1573+328))/1922
          top: "32px",
          width: "17.07%", // 328/1922
          height: "auto",
          mixBlendMode: "screen",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Left-edge cyan flare (1:381) — 328×328 starting at x=-59
          (peeking from left edge) so visible portion is 269px wide. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-left.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: 0,
          top: "39%", // 511/1310
          width: "14%", // 269/1922 visible portion
          height: "auto",
          mixBlendMode: "screen",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Bottom flare (1:380) — 1280×360, centered at bottom of section. */}
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
          width: "66.6%", // 1280/1922
          height: "auto",
          mixBlendMode: "screen",
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[1276px] px-6 pt-16 md:pt-[120px] pb-16 md:pb-[100px]">
        {/* Heading group (Figma 1:382 — 752w × 240h, centered) */}
        <div className="text-center mx-auto mb-12 md:mb-[52px]" style={{ maxWidth: "752px" }}>
          <h2
            className="text-white mx-auto"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              maxWidth: "664px",
              marginBottom: "32px", // (276-244) gap between title bottom and body top
            }}
          >
            How CleanStart Enables{" "}
            <span
              style={{
                background:
                  "linear-gradient(95deg, #239CFF 0%, #82AEFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FIPS 140-3 Compliance
            </span>
          </h2>
          <p
            className="text-white mx-auto"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.15vw, 22px)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.5,
              opacity: 0.85,
            }}
          >
            CleanStart embeds validated cryptographic foundations directly into
            hardened container environments.
          </p>
        </div>

        {/* -------------------- Hub diagram (desktop) -------------------- */}
        {/* 1014×788 box, centered. Pills positioned at exact Figma local coords.
            overflow-visible so pills can extend slightly past the box edges
            (Compliance Automation sits flush with the 1014px right edge in Figma). */}
        <div
          className="hidden md:block relative mx-auto"
          style={{
            width: "100%",
            maxWidth: `${HUB_W}px`,
            aspectRatio: `${HUB_W} / ${HUB_H}`,
          }}
        >
          {/* Center orb (1:386 — 745×745 at local x=133 y=33).
              Width 745/1014 = 73.47%, top 33/788 = 4.19%, left 133/1014 = 13.12%. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/fips/hub-orb.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: `${(133 / HUB_W) * 100}%`,
              top: `${(33 / HUB_H) * 100}%`,
              width: `${(745 / HUB_W) * 100}%`,
              height: "auto",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Center label (1:425 — 110×110 at local x=453 y=359). */}
          <div
            className="absolute flex items-center justify-center text-center"
            style={{
              left: `${(453 / HUB_W) * 100}%`,
              top: `${(359 / HUB_H) * 100}%`,
              width: `${(110 / HUB_W) * 100}%`,
              aspectRatio: "1 / 1",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(11px, 0.83vw, 14px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "#FFFFFF",
              }}
            >
              Validated
              <br />
              Foundation
            </span>
          </div>

          {/* Orbiting pills */}
          {PILLS.map((pill) => (
            <div
              key={pill.label}
              className="absolute"
              style={{
                left: `${(pill.x / HUB_W) * 100}%`,
                top: `${(pill.y / HUB_H) * 100}%`,
                width: `${(PILL_W / HUB_W) * 100}%`,
                aspectRatio: `${PILL_W} / ${PILL_H}`,
              }}
            >
              <HubPill label={pill.label} />
            </div>
          ))}
        </div>

        {/* -------------------- Mobile: orb + pill grid -------------------- */}
        <div className="md:hidden flex flex-col items-center gap-8">
          <div className="relative" style={{ width: "260px", height: "260px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/fips/hub-orb.png"
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
            <span
              className="absolute inset-0 flex items-center justify-center text-center text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Validated
              <br />
              Foundation
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-[400px]">
            {PILLS.map((p) => (
              <HubPill key={p.label} label={p.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HubPill({ label }: { label: string }): React.ReactElement {
  return (
    <div
      className="relative inline-flex w-full h-full items-center justify-center text-center px-3"
      style={{
        borderRadius: "12px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(245,247,255,0.95) 100%)",
        boxShadow:
          "0 12px 28px -10px rgba(35, 60, 160, 0.45), 0 0 0 1px rgba(255,255,255,0.20) inset",
        minHeight: "88px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(13px, 1.04vw, 17px)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "#111",
        }}
      >
        {label}
      </span>
    </div>
  );
}
