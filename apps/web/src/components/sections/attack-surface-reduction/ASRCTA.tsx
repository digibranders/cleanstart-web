/**
 * Attack Surface Reduction CTA card — Figma node 783:1295.
 *
 * White card with two lavender (#DF9BFF) corner blur-ellipses for ambient
 * glow, a subtle decorative grid in the background, and a bright blue
 * primary CTA. Rendered inside the Footer's 1276×330 slot via
 * `<Footer cta={<ASRCTA />} />`.
 *
 * Spec (1440 design frame):
 *  - bg: white, radius 40, padding 80 100
 *  - title: 55 px Manrope/Figtree Bold, color #111, ls -2.75 px, w 401
 *  - desc:  21 px Regular, color #111, ls -0.84 px, opacity 0.8, w 493
 *  - button: blue #3960F9 pill, 18 px white label
 *  - ellipse 46683 (top-left): 320×320 at (-139, -168), opacity 0.8, blur 121.5
 *  - ellipse 46682 (bottom-right): 511×511 at (1159, 244), opacity 0.8, blur 121.5
 */

import Link from "next/link";

export function ASRCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ borderRadius: "inherit" }}
    >
      {/* Union — Figma 783:1296. Decorative grid-of-squares pattern with a
          purple radial fade baked into the SVG itself (opacity 0.08).
          Anchored at (547, -220) per the Figma spec; rendered at the
          1101×1101 source size so the cell grid stays at its native scale. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/union-pattern.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
          maxWidth: "none",
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
        draggable={false}
      />

      {/* Top-left lavender ellipse — Figma Ellipse 46683 (320×320, #DF9BFF,
          opacity 0.8, blur 121.5 px). */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* Bottom-right lavender ellipse — Figma Ellipse 46682 (511×511,
          same color/blur). Scaled down at mobile via responsive override
          below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "auto",
          right: "-160px",
          bottom: "-260px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* Content row */}
      <div
        className="relative flex flex-col lg:flex-row lg:items-center"
        style={{ padding: "clamp(40px, 6vw, 64px) clamp(32px, 5vw, 80px)", gap: "clamp(32px, 5vw, 72px)" }}
      >
        {/* Left: headline — auto-wraps 2 or 3 lines via balance */}
        <p
          className="relative"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.1vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111111",
            maxWidth: "min(460px, 100%)",
            textWrap: "balance",
            zIndex: 1,
          }}
        >
          Reduce Attack Surface at the Source
        </p>

        {/* Right: description + CTA button */}
        <div
          className="relative flex flex-col"
          style={{ gap: "clamp(20px, 2vw, 32px)", zIndex: 1, maxWidth: "min(460px, 100%)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(16px, 1.5vw, 20px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
              color: "#111111",
              opacity: 0.8,
              maxWidth: "493px",
            }}
          >
            Build with only what production needs.
          </p>

          <Link
            href="/contact-us"
            className="inline-flex items-center self-start gap-2 text-white transition-transform duration-200 hover:-translate-y-px"
            style={{
              padding: "11px 14px 11px 17px",
              borderRadius: "8px",
              background:
                "linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)",
              boxShadow:
                "0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px #3960F9",
              fontFamily: "var(--font-sans)",
              fontSize: "16px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            <span>Attack Surface Reduction</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 9h11m0 0l-4-4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
