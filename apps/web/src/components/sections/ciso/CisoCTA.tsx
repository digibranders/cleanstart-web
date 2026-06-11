import type React from "react";
import Link from "next/link";

export function CisoCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
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

      <div className="sm:hidden absolute inset-0">

        {/* Cube intentionally omitted on mobile: CTA cards carry no decorative
            images at this breakpoint, only the gradient and gridlines. */}

        <p
          className="absolute text-center text-white"
          style={{
            top: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "260px",
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
          }}
        >
          Reduce Software Risk With Continuous Governance
        </p>

        <p
          className="absolute text-center text-white"
          style={{
            top: "150px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "265px",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            opacity: 0.8,
          }}
        >
          Strengthen software trust, accelerate compliance readiness, and reduce
          inherited software exposure across modern delivery environments.
        </p>

        <div
          className="absolute"
          style={{ top: "262px", left: "50%", transform: "translateX(-50%)" }}
        >
          <Link
            href="/book-a-demo"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-px": "24px",
                "--cs-btn-fs": "16px",
                "--cs-btn-h": "44px",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                letterSpacing: "-0.8px",
                color: "#111",
                border: "1px solid #dab6f3",
                whiteSpace: "nowrap",
              } as React.CSSProperties
            }
          >
            Talk to an Expert
          </Link>
        </div>
      </div>

      <div
        className="hidden sm:flex absolute inset-0 flex-row items-center overflow-hidden"
        style={{
          padding: "0 clamp(32px, 6.35vw, 122px)",
          gap: "clamp(24px, 2.2vw, 32px)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/cta-cube-noise.webp"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: "-60px",
            bottom: "-80px",
            width: "190px",
            height: "193px",
            objectFit: "contain",
            opacity: 0.8,
            transform: "rotate(-0.15deg)",
          }}
          loading="lazy"
          decoding="async"
        />

        <p
          className="relative text-white flex-shrink-0"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "min(360px, 100%)",
            textWrap: "balance",
          }}
        >
          Reduce Software Risk With Continuous Governance
        </p>

        <div
          className="relative flex flex-col"
          style={{ maxWidth: "min(540px, 100%)", gap: "clamp(16px, 1.25vw, 24px)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.8)",
              textWrap: "balance",
            }}
          >
            Strengthen software trust, accelerate compliance readiness, and reduce
            inherited software exposure across modern delivery environments.
          </p>

          <Link
            href="/book-a-demo"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "18px",
              } as React.CSSProperties
            }
          >
            <span>Talk to an Expert</span>
            <svg
              className="cs-cta-arrow"
              width="18"
              height="18"
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
