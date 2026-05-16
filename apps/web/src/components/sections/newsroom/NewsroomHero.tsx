const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 38%, #131e8f 67%, #471ec0 86%, #471fc3 100%)";

export function NewsroomHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "498px", background: HERO_GRADIENT }}
      aria-labelledby="newsroom-hero-title"
    >
      {/* Earth image — large, positioned right, only top curve visible */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "calc(50% + 436px - 720px)",
          top: "43px",
          width: "1457px",
          height: "1189px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/newsroom/hero-earth.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Grid overlay — pinned over the earth on the right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "calc(50% + 604px - 720px)",
          top: "0px",
          width: "730px",
          height: "708px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/newsroom/hero-grid.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full"
        />
      </div>

      {/* Decorative glow left */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-119px",
          top: "200px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-glow-left.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative mx-auto max-w-[1276px] px-6">
        <div
          className="flex flex-col items-center gap-6 mx-auto text-center"
          style={{ paddingTop: "140px", paddingBottom: "80px", maxWidth: "864px" }}
        >
          <h1
            id="newsroom-hero-title"
            className="font-display font-semibold text-white"
            style={{
              fontSize: "clamp(2.75rem, 5.6vw, 5rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
            }}
          >
            Newsroom
          </h1>
          <p
            className="font-sans font-normal text-white"
            style={{
              fontSize: "clamp(1.125rem, 2.08vw, 1.5rem)",
              lineHeight: "1.4",
              letterSpacing: "-0.03em",
              opacity: 0.85,
              maxWidth: "640px",
            }}
          >
            Stay on top of the news and know what&apos;s happening.
          </p>
        </div>
      </div>
    </section>
  );
}
