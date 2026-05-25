type LogoItem = {
  src: string;
  alt: string;
  /** Figma intrinsic width */
  w: number;
  /** Figma intrinsic height */
  h: number;
};

/**
 * Logos from Figma node 792:2886 — colored PNG screenshots matching exact
 * Figma proportions: CouchDB → PostgreSQL → Redis → Ubuntu → PHP.
 * Two copies in the marquee track for a seamless infinite loop.
 */
const LOGOS: LogoItem[] = [
  { src: "/images/cleanstart-images/stacks-couchdb-color.png",    alt: "Apache CouchDB", w: 176, h: 88 },
  { src: "/images/cleanstart-images/stacks-postgresql-color.png",  alt: "PostgreSQL",     w: 295, h: 56 },
  { src: "/images/cleanstart-images/stacks-redis-color.png",       alt: "Redis",          w: 149, h: 47 },
  { src: "/images/cleanstart-images/stacks-ubuntu-color.png",      alt: "Ubuntu",         w: 169, h: 65 },
  { src: "/images/cleanstart-images/stacks-php-color.png",         alt: "PHP",            w: 96,  h: 47 },
];

export function CleanStartImagesEnvironment(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesModernStacks"
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131e8f 67.14%, #471ec0 107.43%)",
        paddingTop: "clamp(56px, 7vw, 100px)",
        paddingBottom: "clamp(56px, 7vw, 100px)",
      }}
    >
      {/* ── Subtle grid pattern ──────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── Large top-right grid vector (node 792:2887) ─────────────────────── */}
      {/* Figma: left=1432px top=-422px size=1101px in 1920px frame → right anchor */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          right: "-450px",
          top: "-300px",
          width: "1101px",
          height: "1101px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-top-right-vector.svg"
          alt=""
          width={1101}
          height={1101}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Union hexagon — top-left corner ─────────────────────────────────── */}
      {/* Figma: left=-109px top=-94px size=305.606×318.251px mix-blend:overlay */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "-109px",
          top: "-94px",
          width: "305.606px",
          height: "318.251px",
          mixBlendMode: "overlay",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-union-hex.svg"
          alt=""
          width={211}
          height={246}
          style={{
            display: "block",
            width: "211px",
            height: "246px",
            flexShrink: 0,
            transform: "rotate(-150deg) scaleY(-1)",
            opacity: 0.3,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Union hexagon — top-right corner ────────────────────────────────── */}
      {/* Figma: left=1214px top=-84px in 1920px frame → proportional right */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "calc(1214 / 1920 * 100%)",
          top: "-84px",
          width: "305.606px",
          height: "318.251px",
          mixBlendMode: "overlay",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-union-hex.svg"
          alt=""
          width={211}
          height={246}
          style={{
            display: "block",
            width: "211px",
            height: "246px",
            flexShrink: 0,
            transform: "rotate(-150deg) scaleY(-1)",
            opacity: 0.3,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Ellipse glow — bottom-left ───────────────────────────────────────── */}
      {/* Figma: left=-72px size=315px, inner image at inset=-64.44% → 721px */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-72px",
          bottom: "-40px",
          width: "315px",
          height: "315px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-64.44%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/env-ellipse-glow.svg"
            alt=""
            width={721}
            height={721}
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center">

        {/* Heading — max-width forces "Images for Modern" / "Stacks" wrap */}
        <h2
          className="font-display text-white text-center"
          style={{
            fontSize: "var(--text-display-md)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "clamp(280px, 43vw, 623px)",
            textWrap: "wrap" as const,
          }}
        >
          {"Images for Modern "}
          <span className="cs-text-gradient-impact">Stacks</span>
        </h2>

        {/* ── Infinite logo marquee ──────────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ marginTop: "clamp(40px, 5vw, 80px)" }}
        >
          {/* Left gradient fade — Figma: from #191e93 → transparent, w≈229px */}
          <div
            aria-hidden
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: "clamp(80px, 12vw, 180px)",
              background:
                "linear-gradient(to right, #191e93 0%, rgba(25,30,147,0) 100%)",
            }}
          />
          {/* Right gradient fade — Figma: from #191e93 18.4% → transparent */}
          <div
            aria-hidden
            className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: "clamp(80px, 12vw, 180px)",
              background:
                "linear-gradient(to left, #191e93 18.391%, rgba(25,30,147,0) 100%)",
            }}
          />

          {/* Marquee track — two full copies for seamless loop */}
          <div
            className="cs-marquee"
            style={{
              animationDuration: "35s",
              gap: "clamp(48px, 8vw, 120px)",
              alignItems: "center",
            }}
            aria-hidden
          >
            {/* Copy A */}
            {LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`a-${logo.alt}`}
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="shrink-0 select-none pointer-events-none"
                style={{
                  height: "clamp(32px, 4vw, 56px)",
                  width: "auto",
                  opacity: 0.95,
                }}
                loading="eager"
                decoding="async"
              />
            ))}
            {/* Copy B — identical, enables seamless infinite loop */}
            {LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`b-${logo.alt}`}
                src={logo.src}
                alt=""
                aria-hidden
                width={logo.w}
                height={logo.h}
                className="shrink-0 select-none pointer-events-none"
                style={{
                  height: "clamp(32px, 4vw, 56px)",
                  width: "auto",
                  opacity: 0.95,
                }}
                loading="eager"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
