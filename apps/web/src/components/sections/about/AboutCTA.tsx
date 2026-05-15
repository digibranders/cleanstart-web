export function AboutCTA() {
  return (
    <section className="relative w-full bg-white mb-[-175px] py-10">
      <div className="relative z-20 mx-auto max-w-[1276px] px-6">
        {/* CTA card — Figma: gradient #131E8F → #471EC0, rounded-[40px], 1276×335 */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "40px",
            background: "linear-gradient(180deg, #131E8F 0%, #471EC0 111%)",
            padding: "clamp(40px, 5vw, 80px) clamp(24px, 6vw, 80px)",
          }}
        >
          {/* Decorative background pattern overlay */}
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

          {/* Purple radial blob */}
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

          {/* Content */}
          <div className="relative flex flex-col items-center gap-8 text-center text-white">
            <div className="flex flex-col items-center gap-5">
              <h2
                className="font-sans font-bold"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.4375rem)",
                  lineHeight: "1.0",
                  letterSpacing: "-0.05em",
                }}
              >
                Start Clean. Stay Secure.
              </h2>
              <p
                className="font-sans text-white/80"
                style={{
                  fontSize: "clamp(1rem, 1.5vw, 1.3125rem)",
                  fontWeight: 400,
                  lineHeight: "1.4",
                  letterSpacing: "-0.04em",
                  maxWidth: "480px",
                }}
              >
                Take the next step toward trusted software delivery
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-12">
              {/* Glass "Contact Sales" button */}
              <a
                href="#contact"
                className="cs-btn-glass"
                style={{
                  ["--cs-btn-h" as string]: "43px",
                  ["--cs-btn-px" as string]: "18px",
                  ["--cs-btn-fs" as string]: "18px",
                  fontFamily:
                    "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
                  color: "#111111",
                  letterSpacing: "-0.01em",
                  fontWeight: 500,
                }}
              >
                Contact Sales
              </a>

              {/* Blue "How it works" button */}
              <a
                href="#how-it-works"
                className="cs-btn-blue"
                style={{ width: "163px", height: "43px", fontSize: "18px" }}
              >
                How it works
              </a>

              {/* Blue "Careers" button */}
              <a
                href="#careers"
                className="cs-btn-blue"
                style={{ width: "111px", height: "43px", fontSize: "18px" }}
              >
                Careers
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
