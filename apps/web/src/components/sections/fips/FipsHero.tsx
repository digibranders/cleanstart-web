import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";

export function FipsHero(): React.ReactElement {
  return (
    <section
      data-section="FipsHero"
      className="relative overflow-hidden bg-cs-hero md:min-h-[clamp(658px,46.32vw,667px)]"
    >
      {/* Bottom fade blends the hero gradient into the white section below. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "200px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)",
        }}
      />

      {/* Mobile-only purple radial glow behind the shield. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          top: "336px",
          width: "360px",
          height: "320px",
          background:
            "radial-gradient(ellipse at center, rgba(118, 62, 255, 0.70) 0%, rgba(90, 30, 200, 0.45) 35%, rgba(60, 10, 140, 0) 75%)",
          filter: "blur(8px)",
        }}
      />

      <div
        className="relative mx-auto z-[2] px-6 md:min-h-[clamp(658px,46.32vw,667px)]"
        style={{
          maxWidth: "1276px",
          paddingTop: "clamp(112px, 12.92vw, 200px)",
          paddingBottom: "0",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-glow.webp"
          alt=""
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "44.75%",
            top: "53px",
            width: "57.21%",
            height: "auto",
            mixBlendMode: "screen",
            opacity: 0.85,
          }}
          loading="eager"
          decoding="async"
        />

        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "58.31%",
            top: "149px",
            width: "38.95%",
            aspectRatio: "497 / 502",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(118, 62, 255, 0.55) 0%, rgba(118, 62, 255, 0) 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-only.webp"
          alt=""
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "59.56%",
            top: "159px",
            width: "31.35%",
            height: "auto",
          }}
          loading="eager"
          decoding="async"
        />

        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "623px" }}
        >
          <HeroReveal y={50} duration={1.0}>
            <h1
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-display)",
                fontWeight: 600,
                letterSpacing: "var(--text-hero-product-ls, -0.04em)",
                lineHeight: "var(--text-hero-lh, 1.05)",
                marginBottom: "clamp(16px, 1.67vw, 24px)",
              }}
            >
              FIPS-Validated. Always{" "}
              <span className="cs-text-gradient-impact">Verified.</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.8)",
                width: "100%",
                marginBottom: "clamp(24px, 2.22vw, 32px)",
              }}
            >
              Built on validated cryptographic foundations for secure, compliant
              container environments
            </p>
          </HeroReveal>

          {/* CTA appears before the shield on mobile. */}
          <HeroReveal y={30} delay={0.35} duration={0.8}>
            <Link
              href="https://images.cleanstart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-px": "24px",
                  "--cs-btn-fs": "16px",
                } as React.CSSProperties
              }
            >
              Explore FIPS Images
              <svg
                className="cs-cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </HeroReveal>
        </div>

        {/* Mobile-only shield badge, rendered in flow below the CTA block. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-only.webp"
          alt=""
          className="pointer-events-none select-none hidden mx-auto relative z-[2]"
          style={{
            width: "200px",
            height: "auto",
            marginTop: "40px",
          }}
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
}
