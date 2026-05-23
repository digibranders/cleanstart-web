import Image from "next/image";
import Link from "next/link";

/*
 * CleanSight Hero — Figma node 799:236
 *
 * Layout: left column (heading + desc + CTA), right column (MacBook screenshot).
 * Background: navy → indigo → violet vertical gradient. No grid lines.
 * Decoratives: soft purple radial glow behind the heading, subtle cyan accent
 * behind the MacBook. Bottom fade into the next section.
 *
 * Typography uses the product-hero token system:
 *   H1: clamp(40, 4.45vw, 64) / 700 / Manrope
 *   Subhead: clamp(18, 1.7vw, 24) / 400 / Sora
 */
export function CleanSightHero(): React.ReactElement {
  return (
    <section
      data-section="CleanSightHero"
      className="relative overflow-hidden"
      style={{
        minHeight: "clamp(560px, 50vw, 720px)",
        background:
          "linear-gradient(179.996deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.16%, rgb(19,30,143) 51%, rgb(71,30,192) 68.71%, rgb(71,31,195) 79.83%, rgba(70,30,191,0.85) 85%, rgba(66,30,188,0.4) 93.72%, rgba(66,30,188,0) 98.92%)",
      }}
    >
      {/* ── Soft cyan accent — bottom-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-180px",
          bottom: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44, 193, 235, 0.20) 0%, rgba(44, 193, 235, 0) 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* ── Bottom fade — softens hero into the next section ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0"
        style={{
          height: "160px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.85) 85%, #ffffff 100%)",
          zIndex: 1,
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "clamp(96px, 11vw, 160px)",
          paddingBottom: "clamp(72px, 8vw, 120px)",
          zIndex: 2,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-8">
          {/* Left: heading + desc + CTA */}
          <div className="flex flex-col items-start gap-8 lg:flex-[1.25] lg:min-w-0">
            <h1
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 4.45vw, 64px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              <span className="block whitespace-nowrap">Continuous Visibility.</span>
              <span className="block whitespace-nowrap">
                Continuous{" "}
                <span className="cs-text-gradient-impact">Remediation.</span>
              </span>
            </h1>

            <p
              className="text-white max-w-[560px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(18px, 1.7vw, 24px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                opacity: 0.8,
              }}
            >
              Continuously discover, assess, and remediate container risk across
              modern environments.
            </p>

            <Link
              href="/contact-us"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-px": "18px",
                  "--cs-btn-fs": "16px",
                } as React.CSSProperties
              }
            >
              <span>Contact Us</span>
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

          {/* Right: MacBook + decoratives locked to it.
              Grid + purple glow are absolutely positioned within this
              container and centred on the laptop image so they scale and
              move together as one unit. */}
          <div className="relative w-full lg:flex-1 lg:max-w-[560px]">
            {/* ── SVG grid (Figma Vector 799:472) — centred on the laptop ── */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleansight/hero-grid.svg"
              alt=""
              className="pointer-events-none select-none absolute hidden lg:block"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "125%",
                aspectRatio: "790 / 708",
                mixBlendMode: "screen",
                zIndex: 0,
              }}
              loading="eager"
              decoding="async"
            />

            {/* ── Ellipse 46693 — purple glow centred behind the laptop ── */}
            <div
              aria-hidden
              className="pointer-events-none select-none absolute hidden lg:block"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "75%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                background: "#C03BFF",
                opacity: 0.5,
                filter: "blur(121.5px)",
                zIndex: 1,
              }}
            />

            {/* ── MacBook screenshot ── */}
            <Image
              src="/images/cleansight/hero-macbook.png"
              alt="CleanSight dashboard showing container visibility metrics, vulnerability breakdown, and ecosystem package distribution"
              width={1624}
              height={1120}
              sizes="(min-width: 1024px) 640px, 100vw"
              className="relative w-full h-auto select-none"
              style={{ zIndex: 2 }}
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
