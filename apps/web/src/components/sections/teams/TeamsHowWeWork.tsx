export function TeamsHowWeWork() {
  return (
    <section
      className="relative overflow-hidden bg-cs-hero bg-cs-grid"
      style={{ paddingBottom: "250px" }}
    >
      {/* Decorative line accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
        style={{
          left: "calc(355px / 1920 * 100%)",
          top: "142px",
          width: "2px",
          height: "70px",
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
        style={{
          left: "calc(1564px / 1920 * 100%)",
          top: "142px",
          width: "2px",
          height: "70px",
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-6 pt-[100px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2
            className="font-display font-bold text-white"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.875rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
            }}
          >
            {"How We "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(102.46deg, rgb(154,81,255) 65.66%, rgb(44,193,235) 93.65%)",
              }}
            >
              Work
            </span>
          </h2>
          <p
            className="max-w-[911px] font-sans text-white/80"
            style={{
              fontSize: "clamp(1.125rem, 2vw, 1.875rem)",
              lineHeight: "1.4",
              letterSpacing: "-0.04em",
            }}
          >
            We work the way we build, with clarity, trust, and continuous
            improvement at every step.
          </p>
        </div>
      </div>
    </section>
  );
}
