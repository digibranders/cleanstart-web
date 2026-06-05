import { HeroReveal } from "@/components/ui/Reveal";

export function NewsroomHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(380px, 35vw, 498px)", background: "#151021" }}
      aria-labelledby="newsroom-hero-title"
    >
      {/* Grid mask: full-section width so it scales with the viewport; masked so the pattern only shows at the four corners and fades toward the centre. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #2a1f56 1.29px, transparent 1.29px), linear-gradient(to bottom, #2a1f56 1.29px, transparent 1.29px)",
          backgroundSize: "71.11px 71.11px",
          backgroundPosition: "0 0",
          WebkitMaskImage:
            "radial-gradient(circle 360px at 0% 0%, black 0%, transparent 100%), radial-gradient(circle 360px at 100% 0%, black 0%, transparent 100%), radial-gradient(circle 320px at 0% 100%, black 0%, transparent 100%), radial-gradient(circle 320px at 100% 100%, black 0%, transparent 100%)",
          maskImage:
            "radial-gradient(circle 360px at 0% 0%, black 0%, transparent 100%), radial-gradient(circle 360px at 100% 0%, black 0%, transparent 100%), radial-gradient(circle 320px at 0% 100%, black 0%, transparent 100%), radial-gradient(circle 320px at 100% 100%, black 0%, transparent 100%)",
          WebkitMaskComposite: "source-over",
          maskComposite: "add",
        }}
      />

      {/* Gradient overlay drawn above the grid; violet stops stay translucent at the bottom so the gridlines read through. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          background:
            "linear-gradient(179.99deg, rgba(21,16,33,0.45) -25.7%, rgba(16,18,62,0.4) 41.22%, rgba(19,30,143,0.45) 71.9%, rgba(71,30,192,0.5) 85.41%, rgba(71,31,195,0.55) 98.5%, rgba(70,30,191,0.5) 104.61%, rgba(66,30,188,0.3) 114.85%, rgba(66,30,188,0) 120.97%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2"
        style={{ top: 0, width: "1920px", height: "498px" }}
      >
        <span
          className="absolute block"
          style={{
            left: "1659px",
            top: "-72px",
            width: "129.29px",
            height: "312.74px",
            background: "#7a59ff",
            opacity: 0.25,
            filter: "blur(125px)",
            transform: "rotate(43deg)",
          }}
        />
        <span
          className="absolute block"
          style={{
            left: "-280.57px",
            top: "-358.14px",
            width: "974.35px",
            height: "862.53px",
            background: "#7a59ff",
            opacity: 0.03,
            filter: "blur(125px)",
            transform: "rotate(43deg)",
          }}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2"
        style={{ top: 0, width: "1920px", height: "498px" }}
      >
        <span
          className="absolute"
          style={{
            left: "213.33px",
            top: "142.22px",
            width: "1.29px",
            height: "142.22px",
            background: "#7a59ff",
            opacity: 0.28,
          }}
        />
        <span
          className="absolute"
          style={{
            left: "426.67px",
            top: "285.74px",
            width: "1.29px",
            height: "142.22px",
            background: "#7a59ff",
            opacity: 0.28,
          }}
        />
        <span
          className="absolute"
          style={{
            left: "142.22px",
            top: "355.56px",
            width: "1.29px",
            height: "142.22px",
            background: "#7a59ff",
            opacity: 0.18,
          }}
        />
        <span
          className="absolute"
          style={{
            left: "1707px",
            top: "72px",
            width: "1.29px",
            height: "69.82px",
            background: "#7a59ff",
            opacity: 0.5,
          }}
        />
        <span
          className="absolute"
          style={{
            left: "1778px",
            top: "143px",
            width: "1.29px",
            height: "69.82px",
            background: "#7a59ff",
            opacity: 0.2,
          }}
        />
      </div>

      {/* Radial-fade grid overlay pinned over the earth area. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2"
        style={{ top: 0, width: "730px", height: "708px" }}
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

      {/* Earth anchored to the bottom edge so only the top curve peeks above the hero floor; lighten blend merges the atmosphere into the violet gradient. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "-1280px",
          width: "1600px",
          height: "1600px",
          mixBlendMode: "lighten",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/newsroom/hero-earth.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col items-center gap-6 mx-auto text-center"
          style={{ paddingTop: "clamp(88px, 11vw, 146px)", paddingBottom: "clamp(40px, 5vw, 80px)", maxWidth: "1080px" }}
        >
          <HeroReveal y={50} duration={1.0}>
            <h1
              id="newsroom-hero-title"
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h1)",
                lineHeight: "var(--text-hero-lh)",
                letterSpacing: "var(--text-hero-utility-ls)",
              }}
            >
              Newsroom
            </h1>
          </HeroReveal>
          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="font-sans font-normal text-white"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: "1.4",
                letterSpacing: "-0.04em",
              }}
            >
              Follow the latest developments in trusted software delivery, from
              product launches and partnerships to research, industry insights,
              and company news.
            </p>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
