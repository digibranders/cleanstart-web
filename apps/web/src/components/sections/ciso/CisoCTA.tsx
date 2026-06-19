import type React from "react";
import Link from "next/link";

export function CisoCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Soft purple corner glows — give the white card a warm brand tint. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(223, 155, 255, 0.35)",
          filter: "blur(90px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          right: "-120px",
          bottom: "-150px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "rgba(223, 155, 255, 0.28)",
          filter: "blur(110px)",
        }}
      />

      <div className="sm:hidden absolute inset-0">

        {/* Cube intentionally omitted on mobile: CTA cards carry no decorative
            images at this breakpoint, only the gradient and gridlines. */}

        <p
          className="absolute text-center"
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
            color: "#111",
          }}
        >
          Reduce Software Risk With Continuous Governance
        </p>

        <p
          className="absolute text-center"
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
            color: "rgba(17, 17, 17, 0.8)",
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
            href="/contact-us"
            className="cs-btn-blue"
            style={
              {
                "--cs-btn-px": "24px",
                "--cs-btn-fs": "16px",
                "--cs-btn-h": "44px",
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
          src="/images/vulnerability-remediation/cta-cube.webp"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: "-44px",
            bottom: "-44px",
            width: "190px",
            height: "190px",
            objectFit: "contain",
            opacity: 0.5,
          }}
          loading="lazy"
          decoding="async"
        />

        <p
          className="relative flex-shrink-0"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "min(360px, 100%)",
            textWrap: "balance",
            color: "#111",
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
              color: "rgba(17, 17, 17, 0.8)",
              textWrap: "balance",
            }}
          >
            Strengthen software trust, accelerate compliance readiness, and reduce
            inherited software exposure across modern delivery environments.
          </p>

          <Link
            href="/contact-us"
            className="cs-btn-blue self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "18px",
              } as React.CSSProperties
            }
          >
            <span>Talk to an Expert</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
