import Link from "next/link";

export function CleanSightHero(): React.ReactElement {
  return (
    <section
      data-section="CleanSightHero"
      className="relative overflow-hidden"
      style={{
        minHeight: "652px",
        backgroundColor: "#151021",
        /* Grid lines on top, then the exact Figma hero gradient */
        backgroundImage: [
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          "linear-gradient(180deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.2%, rgb(19,30,143) 51%, rgb(71,30,192) 68.7%, rgb(71,31,195) 79.8%, rgba(70,30,191,0.85) 85%, rgba(66,30,188,0.4) 93.7%, rgba(66,30,188,0) 98.9%)",
        ].join(", "),
        backgroundSize: "80px 80px, 80px 80px, 100% 100%",
        backgroundRepeat: "repeat, repeat, no-repeat",
      }}
    >
      {/* Decorative wave mesh — 730×708 at left:603 per Figma node 373:870 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        src="/images/cleansight/hero-wave-mesh.svg"
        alt=""
        style={{ left: "603px", top: 0, width: "730px", height: "708px", mixBlendMode: "screen", overflow: "hidden" }}
        loading="eager"
        decoding="async"
      />

      {/* Content */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center text-center"
        style={{ paddingTop: "clamp(72px, 8vw, 128px)", paddingBottom: "clamp(72px, 8vw, 120px)" }}
      >
        <h1
          className="text-white max-w-[840px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-hero-product)",
            fontWeight: 600,
            letterSpacing: "var(--text-hero-product-ls)",
            lineHeight: "var(--text-hero-lh)",
          }}
        >
          Continuous Visibility. Continuous Remediation.
        </h1>

        <p
          className="text-white mt-8 max-w-[607px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(16px, 1.5625vw, 30px)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          Continuously discover, assess, and remediate container risk across
          modern environments.
        </p>

        <Link
          href="/contact-us"
          className="cs-btn-glass mt-10 self-center"
          style={
            {
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "20px",
            } as React.CSSProperties
          }
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}
