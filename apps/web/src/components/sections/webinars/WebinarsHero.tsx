import { HeroReveal } from "@/components/ui/Reveal";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 38%, #131e8f 67%, #471ec0 86%, #471fc3 100%)";

function HexCluster({
  side,
}: {
  side: "left" | "right";
}): React.ReactElement {
  const transform = side === "left" ? "rotate(-12deg)" : "rotate(8deg) scale(1.15)";
  const positionStyles: React.CSSProperties =
    side === "left"
      ? { left: "-120px", top: "40px" }
      : { right: "-140px", top: "20px" };
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute hidden md:block"
      style={{
        width: "440px",
        height: "440px",
        mixBlendMode: "screen",
        opacity: 0.55,
        transform,
        ...positionStyles,
      }}
    >
      <svg
        viewBox="0 0 440 440"
        width="440"
        height="440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`hex-stroke-${side}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7FAAFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#5B33F3" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#33BAEC" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`hex-fill-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#33BAEC" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#5B33F3" stopOpacity="0.06" />
          </linearGradient>
          <filter id={`hex-blur-${side}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        <g filter={`url(#hex-blur-${side})`}>
          <polygon
            points="220,30 360,110 360,270 220,350 80,270 80,110"
            fill={`url(#hex-fill-${side})`}
            stroke={`url(#hex-stroke-${side})`}
            strokeWidth="1.5"
          />
        </g>
        <g filter={`url(#hex-blur-${side})`}>
          <polygon
            points="330,140 410,186 410,278 330,324 250,278 250,186"
            fill={`url(#hex-fill-${side})`}
            stroke={`url(#hex-stroke-${side})`}
            strokeWidth="1.25"
            opacity="0.85"
          />
        </g>
        <g filter={`url(#hex-blur-${side})`}>
          <polygon
            points="120,250 180,284 180,352 120,386 60,352 60,284"
            fill={`url(#hex-fill-${side})`}
            stroke={`url(#hex-stroke-${side})`}
            strokeWidth="1.1"
            opacity="0.75"
          />
        </g>
      </svg>
    </div>
  );
}

export function WebinarsHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "420px", background: HERO_GRADIENT }}
      aria-labelledby="webinars-hero-title"
    >
      <HexCluster side="left" />
      <HexCluster side="right" />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "50%",
          top: "30%",
          transform: "translate(-50%, -50%)",
          width: "720px",
          height: "320px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(127,170,255,0.35) 0%, rgba(127,170,255,0) 70%)",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col items-center gap-6 mx-auto text-center"
          style={{ paddingTop: "calc(140px + var(--cs-header-extra))", paddingBottom: "80px", maxWidth: "864px" }}
        >
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              id="webinars-hero-title"
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h1)",
                lineHeight: "var(--text-hero-lh)",
                letterSpacing: "var(--text-hero-utility-ls)",
              }}
            >
              CleanStart Webinar
            </h1>
          </HeroReveal>
          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="font-sans font-normal text-white"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: "1.4",
                letterSpacing: "-0.03em",
                opacity: 0.85,
                maxWidth: "640px",
              }}
            >
              Simplify your software supply chain, on your schedule.
            </p>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
