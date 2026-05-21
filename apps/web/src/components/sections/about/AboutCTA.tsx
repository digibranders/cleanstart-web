/**
 * Inner content for the About page CTA, rendered inside the Footer's fixed
 * 1276×330 / radius-40 slot. The Footer owns the frame; this only paints fill,
 * decorative art, and copy/CTAs.
 */
export function AboutCTA() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-center text-white"
      style={{
        background: "linear-gradient(180deg, #131E8F 0%, #471EC0 111%)",
        padding: "clamp(32px, 5vw, 64px) clamp(24px, 6vw, 80px)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url('/images/about/cta-bg-mask.svg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.8,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-10%",
          top: "-50%",
          width: "640px",
          height: "640px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(127,82,255,0.45) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        <p
          className="font-display font-bold"
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.625rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
          }}
        >
          Start Clean. Stay Secure.
        </p>
        <p
          className="font-sans text-body-lg text-white/80"
          style={{
            fontWeight: 400,
            lineHeight: "1.4",
            letterSpacing: "-0.04em",
            maxWidth: "480px",
          }}
        >
          Take the next step toward trusted software delivery
        </p>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-4 sm:gap-12">
        <a
          href="#contact"
          className="cs-btn-glass"
          style={{
            ["--cs-btn-px" as string]: "18px",
            ["--cs-btn-fs" as string]: "18px",
            color: "#111111",
            letterSpacing: "-0.01em",
            fontWeight: 500,
          }}
        >
          Contact Sales
        </a>
        {/* <a
          href="#how-it-works"
          className="cs-btn-blue"
          style={{ minWidth: "163px" }}
        >
          How it works
        </a> */}
        <a
          href="#careers"
          className="cs-btn-blue"
          style={{ minWidth: "111px" }}
        >
          Careers
        </a>
      </div>
    </div>
  );
}
