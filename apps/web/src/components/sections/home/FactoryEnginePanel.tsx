const LEFT_PILLS = ["Plan", "Analyze", "Orchestrate"];
const RIGHT_PILLS = ["Spec", "Build", "Attest", "Handoff"];

function EngineArrow() {
  // Tight viewBox cropped EXACTLY to the arrow shape (path coords 190..341 × 21..92)
  // No left/right padding so the tail starts at x=0 of the rendered SVG.
  return (
    <svg
      width="151"
      height="71"
      viewBox="190 21 151 71"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{
        overflow: "visible",
        filter:
          "drop-shadow(-8px 4px 8px rgba(0,0,0,0.23)) drop-shadow(-33px 16px 18px rgba(0,0,0,0.20))",
      }}
    >
      <path
        d="M291.331 35.1945V29.0367C291.331 25.8824 294.811 23.9692 297.475 25.6596L338.68 51.815C341.155 53.3862 341.155 56.9981 338.68 58.5692L297.475 84.7247C294.811 86.4151 291.331 84.5019 291.331 81.3476V74.6151C291.331 72.4059 289.54 70.6151 287.331 70.6151H221.084C207.431 70.6151 195.139 78.889 190 91.5387V21C195.186 32.1005 206.33 39.1945 218.582 39.1945H287.331C289.54 39.1945 291.331 37.4036 291.331 35.1945Z"
        fill="url(#engineArrowFill)"
      />
      <path
        d="M292.831 29.0371C292.831 27.0657 295.006 25.8693 296.671 26.9258L337.876 53.0811C339.423 54.063 339.423 56.3207 337.876 57.3027L296.671 83.458C295.006 84.5145 292.831 83.3191 292.831 81.3477V74.6152C292.831 71.5777 290.369 69.1153 287.331 69.1152H221.084C208.952 69.1153 197.851 75.3685 191.5 85.3682V26.585C197.613 35.3295 207.678 40.6943 218.582 40.6943H287.331C290.369 40.6942 292.831 38.2318 292.831 35.1943V29.0371Z"
        stroke="url(#engineArrowStroke)"
        strokeWidth="2"
        style={{ mixBlendMode: "plus-lighter" }}
      />
      <defs>
        <linearGradient
          id="engineArrowFill"
          x1="344"
          y1="52.185"
          x2="187.32"
          y2="61.325"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#33BAEC" />
          <stop offset="0.463561" stopColor="#131E8F" />
          <stop offset="1" stopColor="#222594" />
        </linearGradient>
        <radialGradient
          id="engineArrowStroke"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(-135.742 66.7257 -2.41301 -52.9293 329.242 30.6096)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DAB6F3" />
          <stop offset="1" stopColor="#DAB6F3" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function FactoryEnginePanel() {
  return (
    <div className="bg-cs-engine shadow-cs-engine relative overflow-hidden rounded-[24px]">
      {/* Diagonal stripes overlay */}
      <div className="absolute inset-0 bg-cs-diagonal opacity-90" aria-hidden />

      {/* Lavender top-left highlight border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{ boxShadow: "inset 1px 1px 0 0 rgba(218, 182, 243, 0.45)" }}
        aria-hidden
      />

      {/* Inner layout — Figma exact: panel 1276px wide.
           L pad 46 (3.61%) | left card 512 (40.13%) | arrow 154 (12.07%) | right card 512 (40.13%) | R pad 50 (3.92%)
           Arrow is a CHILD of the left card so its left edge naturally aligns with the card's right edge via `left: 100%`.
           Mobile: cards stack vertically, arrow hidden. lg+: side-by-side Figma layout. */}
      <div className="relative flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:px-[3.61%] lg:py-[33px]">
        {/* Left card (relative, so arrow can position absolutely inside it).
             Right border is faded to transparent so there's no hard vertical line where the
             arrow connects — the radial blob (below) handles the smooth color transition. */}
        <div
          className="cs-engine-card relative flex h-auto w-full flex-col items-center justify-center gap-[18px] px-5 py-6 sm:px-6 lg:h-[188.72px] lg:w-[40.13%]"
          style={{ borderRightColor: "transparent" }}
        >
          <div className="flex w-full max-w-[343px] flex-col items-start gap-4">
            <h4
              className="font-display text-white"
              style={{
                fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)",
                fontWeight: 500,
                lineHeight: "100%",
                letterSpacing: "-0.05em",
              }}
            >
              AI Logic Engine
            </h4>
            <p
              className="font-sans text-white opacity-80"
              style={{
                fontSize: "clamp(0.875rem, 1.4vw, 1.125rem)",
                fontWeight: 400,
                lineHeight: "110%",
                letterSpacing: "-0.04em",
              }}
            >
              Multi-agent orchestration that plans, analyzes, and optimizes every build.
            </p>
          </div>
          <div className="flex w-full max-w-[343px] flex-wrap items-center gap-2 lg:gap-4">
            {LEFT_PILLS.map((p) => (
              <button key={p} type="button" className="cs-pill-cta">
                {p}
              </button>
            ))}
          </div>

          {/* Smooth blend — single soft radial blob centered at the card→arrow junction.
               Fades in all directions with no hard edges. The dense center (#222594) matches
               the arrow tail color exactly so they merge as one continuous color. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              right: "-60px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "320px",
              height: "260px",
              background:
                "radial-gradient(ellipse 50% 35% at 30% 50%, #222594 0%, rgba(34, 37, 148, 0.85) 18%, rgba(34, 37, 148, 0.55) 38%, rgba(34, 37, 148, 0.25) 62%, rgba(34, 37, 148, 0) 90%)",
              filter: "blur(10px)",
              zIndex: 0,
            }}
          />

          {/* Arrow — only visible on lg+ side-by-side layout */}
          <div
            className="pointer-events-none absolute z-10 hidden lg:block"
            style={{
              left: "100%",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            aria-hidden
          >
            <EngineArrow />
          </div>
        </div>

        {/* Right card */}
        <div className="cs-engine-card flex h-auto w-full flex-col items-center justify-center gap-[18px] px-5 py-6 sm:px-6 lg:h-[188.72px] lg:w-[40.13%]">
          <div className="flex w-full max-w-[365px] flex-col items-start gap-4">
            <h4
              className="font-display text-white"
              style={{
                fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)",
                fontWeight: 500,
                lineHeight: "100%",
                letterSpacing: "-0.05em",
              }}
            >
              CleanCompile Factory
            </h4>
            <p
              className="font-sans text-white opacity-80"
              style={{
                fontSize: "clamp(0.875rem, 1.4vw, 1.125rem)",
                fontWeight: 400,
                lineHeight: "110%",
                letterSpacing: "-0.04em",
              }}
            >
              Hermetic, deterministic builds. Only what you specify.
            </p>
          </div>
          <div className="flex w-full max-w-[365px] flex-wrap items-center gap-2 lg:gap-4">
            {RIGHT_PILLS.map((p) => (
              <button key={p} type="button" className="cs-pill-cta">
                {p}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
