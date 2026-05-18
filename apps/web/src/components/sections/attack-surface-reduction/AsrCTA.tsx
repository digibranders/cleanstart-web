import Link from "next/link";

/**
 * Inner content for the Attack Surface Reduction CTA — Figma Frame 2147238450
 * (366:6361). Renders inside the Footer's 1276×330 slot.
 *
 * Source of truth: Figma node 366:6361 — fills, sizes, shadows, gradient
 * button colors all extracted directly from the node fills/styles.
 *
 * Layer structure (top-down):
 *  1. Card background layer: rounded-40 + overflow-hidden — clips the SVG grid
 *     and the purple glow ellipses to the card's rounded box.
 *  2. Content layer: heading on left, paragraph + button on right.
 *  3. Bird layer: positioned absolutely at the bottom-center; intentionally
 *     overflows below the card so its lower body slips behind the Footer's
 *     dark area below — matching the Figma "kubr bird peeking up from behind
 *     the footer" effect.
 */
export function AsrCTA(): React.ReactElement {
  return (
    <div
      data-section="AsrCTA"
      className="absolute inset-0"
      style={{
        padding: "clamp(28px, 4.17vw, 60px) clamp(28px, 6.27vw, 80px)",
      }}
    >
      {/* Card background — clips grid/glow ellipses to the rounded card shape */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-[40px]"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Purple SVG grid (Union node 366:6362) — extends well off the card
            to the right with a radial fade. Position from Figma: x=547, y=-220
            relative to a 1276-wide card. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/cta-grid.svg"
          alt=""
          className="pointer-events-none select-none absolute"
          style={{
            left: "calc(547 / 1276 * 100%)",
            top: "-220px",
            width: "1101px",
            height: "1101px",
            maxWidth: "none",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Purple glow — Ellipse 46682 (right). x=1159, y=244, 511×511,
            fill #DF9BFF, blur 243px, opacity 0.8 */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: "calc(1159 / 1276 * 100%)",
            top: "244px",
            width: "511px",
            height: "511px",
            borderRadius: "50%",
            background: "#DF9BFF",
            filter: "blur(243px)",
            opacity: 0.8,
          }}
        />

        {/* Purple glow — Ellipse 46683 (top-left). x=-139, y=-168, 320×320,
            fill #DF9BFF, blur 243px, opacity 0.8 */}
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
            filter: "blur(243px)",
            opacity: 0.8,
          }}
        />
      </div>

      {/* Bird mascot — Figma 366:6366. Positioned absolutely so it overflows
          below the card's bottom edge into the Footer dark area, where the
          Footer's content paints OVER the bird's lower body — producing the
          "rising from behind the footer" effect. NOT inside the rounded
          overflow-hidden wrapper above. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/attack-surface-reduction/cta-bird-new.png"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "calc(368 / 1276 * 100%)",
          bottom: "-50px",
          width: "clamp(240px, 18.4vw, 350px)",
          height: "auto",
          zIndex: 1,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Desktop content row: heading │ (paragraph + button) */}
      <div className="relative hidden md:flex h-full items-center justify-between gap-[clamp(40px,7vw,90px)]">
        <h2
          className="text-[#111111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(34px, 2.86vw, 55px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.0,
            maxWidth: "401px",
            flexShrink: 0,
          }}
        >
          Reduce Attack Surface at the Source
        </h2>

        <div
          className="flex flex-col items-start"
          style={{ maxWidth: "493px", gap: "16px" }}
        >
          <p
            className="text-[#111111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              opacity: 0.8,
              whiteSpace: "nowrap",
            }}
          >
            Build with only what production needs.
          </p>

          <CtaButton />
        </div>
      </div>

      {/* Mobile content stack — bird inline since the overflow trick doesn't
          translate well at narrow widths. */}
      <div className="relative md:hidden flex flex-col items-center text-center gap-6 h-full justify-center">
        <h2
          className="text-[#111111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 6vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.0,
          }}
        >
          Reduce Attack Surface at the Source
        </h2>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/attack-surface-reduction/cta-bird-new.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none"
          style={{ width: "200px", height: "auto" }}
          loading="lazy"
          decoding="async"
        />

        <p
          className="text-[#111111]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          Build with only what production needs.
        </p>

        <CtaButton />
      </div>
    </div>
  );
}

/**
 * Button "Attack Surface Reduction" — Figma Frame 2147238448 (Frame 366:6370).
 * Spec: 290×44, radius 8, fills [#3960F9, #2B97D1] applied as linear gradient,
 * box-shadow per Figma effect_2P8B7P, white text 18px Inter Medium with
 * a white-translucent highlight ellipse at the top-right.
 */
function CtaButton(): React.ReactElement {
  return (
    <Link
      href="/contact"
      className="relative inline-flex items-center justify-center gap-2 text-white transition-transform duration-200 hover:-translate-y-px active:translate-y-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)",
        width: "290px",
        maxWidth: "100%",
        height: "44px",
        borderRadius: "8px",
        fontFamily: "var(--font-sora), Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "18px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        boxShadow:
          "0 0 0 1px #3960F9, 0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {/* Highlight ellipse — Ellipse 3938, 30×30, fill rgba(255,255,255,0.6),
          blur 20px, positioned at x=127, y=41 in Figma (relative to 290×44
          button). Translates to roughly right-center of the button. */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "127px",
          top: "41px",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.6)",
          filter: "blur(20px)",
        }}
      />

      <span className="relative">Attack Surface Reduction</span>

      <svg
        className="relative"
        width="20"
        height="18"
        viewBox="0 0 26 23"
        fill="none"
        aria-hidden
      >
        <path
          d="M16.25 16.21L21.67 11.44L16.25 6.67"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.34 11.44H21.67"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
