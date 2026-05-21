import type React from "react";
import Link from "next/link";

/**
 * SCA Hero — Figma node 690:217 / 604:2163
 * 1920×824px section; dark gradient bg + grid; text left, 3D illustration right.
 *
 * Illustration positioning math (Figma 1920px canvas, 1276px content):
 *   Content left edge  = (1920 − 1276) / 2 = 322px
 *   Illustration x     = 1171px  → 849px from content left
 *   Illustration right = 1171 + 492 = 1663px  → 257px from viewport right
 *   right = 50vw − (492 / 2 + 849 − 638) = 50vw − 703px
 *   clamped to min 0 so it clips cleanly on narrow viewports.
 */

export function SCAHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: "824px",
        backgroundImage: [
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(180deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.2%, rgb(19,30,143) 51%, rgb(71,30,192) 68.7%, rgb(71,31,195) 79.8%, rgba(70,30,191,0.85) 85%, rgba(66,30,188,0.4) 93.7%, rgba(66,30,188,0) 98.9%)",
        ].join(", "),
        backgroundSize: "71px 71px, 71px 71px, 100% 100%",
        backgroundRepeat: "repeat, repeat, no-repeat",
      }}
    >
      {/* ── Decorative blue light flare — Figma node 604:2441–2444 ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "224px",
          top: "434px",
          width: "159px",
          height: "156px",
          background:
            "radial-gradient(ellipse at center, rgba(45,184,249,0.9) 0%, rgba(11,138,227,0.7) 25%, rgba(1,60,125,0.4) 65%, rgba(2,17,47,0) 100%)",
          transform: "rotate(32.82deg)",
          filter: "blur(2px)",
          mixBlendMode: "plus-lighter",
        }}
      />

      {/* ── 3D isometric illustration — Figma node 604:2445 ── */}
      {/* Positioned absolutely so it can overflow the right content edge, matching Figma. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sca/hero-3d-illustration.png"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          width: "492px",
          height: "516px",
          top: "169px",
          right: "max(0px, calc(50vw - 703px))",
          objectFit: "contain",
        }}
        decoding="async"
      />

      {/* ── Text content ── */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6"
        style={{ paddingTop: "clamp(96px, 11vw, 180px)", paddingBottom: "clamp(56px, 7vw, 100px)" }}
      >
        {/* Headline — Figma node 604:2428, 805×160px */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-hero-product)",
            fontWeight: 600,
            letterSpacing: "var(--text-hero-product-ls)",
            lineHeight: "var(--text-hero-lh)",
            color: "#ffffff",
            maxWidth: "805px",
            margin: 0,
          }}
        >
          Smarter Software Composition{" "}
          <span
            style={{
              backgroundImage:
                "linear-gradient(100.39deg, #9a51ff 1.76%, #2cc1eb 98.78%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Analysis
          </span>
        </h1>

        {/* Subtitle — Figma node 604:2429, 688px wide */}
        <p
          style={{
            marginTop: "clamp(16px, 1.67vw, 32px)",
            fontFamily: "var(--font-body)",
            fontSize: "clamp(16px, 1.25vw, 24px)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.8)",
            maxWidth: "688px",
          }}
        >
          Reduce alert fatigue and improve SCA effectiveness with minimal,
          hardened container foundations and contextualized risk insights.
        </p>

        {/* Glass CTA button — Figma node 604:2430 */}
        <Link
          href="/contact-us"
          className="inline-flex items-center gap-2 rounded-[8px] overflow-hidden"
          style={{
            marginTop: "clamp(28px, 2.5vw, 48px)",
            padding: "9px 18px",
            border: "1px solid #dab6f3",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Play icon */}
          <svg
            aria-hidden
            role="presentation"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#111"
          >
            <polygon points="6,4 20,12 6,20" />
          </svg>

          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 0.94vw, 18px)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "#111",
              whiteSpace: "nowrap",
            }}
          >
            Watch How SCA Works
          </span>

          {/* Arrow right */}
          <svg
            aria-hidden
            role="presentation"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
