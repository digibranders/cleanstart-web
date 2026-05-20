/*
 * Figma node 583:2388 — 1276×330 px card (positioned by Footer at top:-170px)
 *
 * Card background: linear-gradient(to bottom, #131e8f → #471ec0 at 111.05%)
 * Heading: 55px Manrope Bold, white, letter-spacing -0.05em, w=520px
 * Description: 21px Sora, white 80% opacity, letter-spacing -0.04em, w=500px
 * Gap between columns: 68px; padding: 80px 100px
 * Button: glassmorphic — border #dab6f3, bg rgba(255,255,255,0.65), text #111
 * Cube decoration: cta-cube.png, 380×380, right side of card
 * Ellipse glow left: 320×320 at left=-139, top=-168
 */

import Link from "next/link";

export function CisoCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* Cyan glow — top-left */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(44, 193, 235, 0.12)",
          filter: "blur(80px)",
        }}
      />

      {/* Purple glow — right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "300px",
          top: "244px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(154, 81, 255, 0.18)",
          filter: "blur(100px)",
        }}
      />

      {/* Cube decoration — right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/cta-cube.png"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          right: "40px",
          top: "-30px",
          width: "380px",
          height: "380px",
          objectFit: "contain",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Content row */}
      <div
        className="relative flex flex-col lg:flex-row items-start"
        style={{ padding: "80px 100px", gap: "68px" }}
      >
        {/* Left: headline */}
        <h2
          className="relative flex-shrink-0 text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 2.86vw, 55px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.0,
            width: "min(520px, 100%)",
            zIndex: 1,
          }}
        >
          Strengthen Your Software Supply Chain Foundations
        </h2>

        {/* Right: description + CTA */}
        <div className="relative flex flex-col flex-1" style={{ gap: "40px", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(14px, 1.09vw, 21px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "500px",
            }}
          >
            Get the executive brief on how minimal, hardened container foundations
            reduce inherited risk across your entire software supply chain.
          </p>

          <Link
            href="/contact-us"
            className="self-start inline-flex items-center gap-2 rounded-[8px] overflow-hidden"
            style={{
              padding: "9px 18px",
              border: "1px solid #dab6f3",
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
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
              Read the Executive Brief
            </span>
            <svg
              aria-hidden
              role="presentation"
              width="18"
              height="18"
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
      </div>
    </div>
  );
}
