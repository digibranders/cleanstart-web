const STATS = [
  { value: "85%", label: "Container coverage" },
  { value: "<24 hr", label: "Remediation cycles" },
  { value: "85%", label: "Risk reduction" },
  { value: "100%", label: "Compliance visibility" },
];

export function CleanSightStats(): React.ReactElement {
  return (
    <section
      data-section="CleanSightStats"
      className="relative overflow-hidden bg-cs-hero"
      style={{ minHeight: "550px" }}
    >
      {/* Decorative blob top-right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "-100px",
          top: "-103px",
          width: "470px",
          height: "470px",
          borderRadius: "50%",
          background: "rgba(154, 81, 255, 0.10)",
          filter: "blur(80px)",
          transform: "rotate(-150deg)",
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-4 sm:px-6 py-16 md:py-20 xl:py-[100px]">
        {/* Heading */}
        <div className="text-center mb-12 xl:mb-[80px]">
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
            }}
          >
            From Visibility to{" "}
            <span
              style={{
                background:
                  "linear-gradient(110deg, #9A51FF 66%, #2CC1EB 94%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Results
            </span>
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-[rgba(255,255,255,0.12)]">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="text-center text-white flex flex-col gap-[18px] items-center py-6 xl:py-0"
              style={{
                borderRight:
                  i < STATS.length - 1
                    ? "1px solid rgba(255,255,255,0.12)"
                    : undefined,
              }}
            >
              <p
                style={{
                  fontFamily: "'Rethink Sans', var(--font-display), sans-serif",
                  fontSize: "clamp(32px, 3.23vw, 62px)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(13px, 1.04vw, 20px)",
                  fontWeight: 400,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.4,
                  opacity: 0.9,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
