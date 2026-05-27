export function TeamsHowWeWork() {
  return (
    <section
      className="relative overflow-hidden bg-cs-grid"
      style={{
        paddingBottom: "var(--spacing-section-cta)",
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 67.14%, #471EC0 107.43%)",
      }}
    >
      {/* Decorative line accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
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
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "calc(1564px / 1920 * 100%)",
          top: "142px",
          width: "2px",
          height: "70px",
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)",
        }}
      />

      {/* ── Center-top purple radial blob (Figma Vector 583:3601) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "calc(679px / 1920 * 100%)",
          top: "-10px",
          width: "571px",
          height: "554px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.25,
        }}
      />

      {/* ── Top-right cube outline (Figma Union 583:3596) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-70px",
          top: "-206px",
          width: "323.83px",
          height: "376.84px",
          transform: "matrix(-0.87, -0.5, -0.5, 0.87, 0, 0)",
          opacity: 0.6,
          mixBlendMode: "overlay",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/teams/union-shape.svg"
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            filter:
              "drop-shadow(0 0 0 #fff) drop-shadow(0 0 0 #9A51FF)",
          }}
        />
      </div>

      {/* ── Bottom-left cube outline (Figma Union 583:3597) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "-110px",
          top: "243px",
          width: "323.83px",
          height: "376.84px",
          transform: "matrix(-0.87, -0.5, -0.5, 0.87, 0, 0)",
          opacity: 0.6,
          mixBlendMode: "overlay",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/teams/union-shape.svg"
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2
            className="font-display text-white"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {"How We "}
            <span className="cs-text-gradient-impact">Work</span>
          </h2>
          <p
            className="max-w-[911px] text-white/80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
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
