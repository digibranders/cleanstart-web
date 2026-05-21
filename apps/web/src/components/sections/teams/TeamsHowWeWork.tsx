export function TeamsHowWeWork() {
  return (
    <section
      className="relative overflow-hidden bg-cs-grid"
      style={{
        paddingBottom: "250px",
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 67.14%, #471EC0 107.43%)",
      }}
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 pt-[100px]">
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
                  "linear-gradient(102.46deg, #9A51FF 66%, #2CC1EB 95%)",
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
