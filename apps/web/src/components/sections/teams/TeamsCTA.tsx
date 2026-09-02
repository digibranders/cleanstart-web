import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Inner content for the Teams page CTA, rendered inside the Footer's
 * 1276×330 slot (overflow-hidden, border-radius 40px). The 3-D cube overflows
 * the card top and is clipped by the Footer's overflow-hidden.
 */
export function TeamsCTA() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden md:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
          opacity: 0.08,
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
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

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/teams/cta-cube-textured.webp"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "-40px",
          bottom: "-140px",
          width: "260px",
          height: "260px",
          objectFit: "contain",
          zIndex: 0,
          opacity: 0.85,
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="hidden md:flex absolute inset-0 items-center justify-center"
        style={{
          paddingLeft: "clamp(28px, 4vw, 64px)",
          paddingRight: "clamp(28px, 4vw, 64px)",
          paddingTop: "clamp(20px, 3vw, 32px)",
          paddingBottom: "clamp(20px, 3vw, 32px)",
        }}
      >
        <Reveal
          header
          className="flex flex-col items-center text-center"
          style={{ gap: "clamp(12px, 1.5vw, 20px)", zIndex: 1, maxWidth: "600px" }}
        >
          <p
            className="font-display font-bold text-white"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              textWrap: "balance",
              margin: 0,
            }}
          >
            Join the Team
          </p>
          <p
            className="font-display"
            style={{
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            Visit our career page to explore open opportunities.
          </p>
          <Link
            href="/careers"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-h": "40px",
                "--cs-btn-px": "24px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            <span>Explore Careers</span>
          </Link>
        </Reveal>
      </div>

      <div className="md:hidden absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8" style={{ gap: "16px" }}>
        <p
          className="relative font-display text-white"
          style={{
            fontSize: "var(--fs-h2)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            margin: 0,
            zIndex: 1,
            maxWidth: "297px",
          }}
        >
          Join the Team
        </p>
        <p
          className="relative font-sans"
          style={{
            fontSize: "var(--fs-body-sm)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.8)",
            margin: 0,
            zIndex: 1,
            maxWidth: "257px",
          }}
        >
          Visit our career page to explore open opportunities.
        </p>
        <Link
          href="/careers"
          className="cs-btn-glass relative w-full justify-center"
          style={
            {
              "--cs-btn-h": "42px",
              "--cs-btn-px": "24px",
              "--cs-btn-fs": "14px",
              maxWidth: "296px",
              zIndex: 1,
            } as React.CSSProperties
          }
        >
          <span>Explore Careers</span>
        </Link>
      </div>
    </div>
  );
}
