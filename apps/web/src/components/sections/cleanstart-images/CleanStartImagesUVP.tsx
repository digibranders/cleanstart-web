type CardData = {
  title: string;
  body: string;
  imgSrc: string;
  imgAlt: string;
  /** Exact percentage offsets of the rendered image inside its overflow-hidden container */
  imgStyle: React.CSSProperties;
  /** gap between image container and text block (px) */
  gap: number;
};

const CARDS: CardData[] = [
  {
    title: "Up to 80% Smaller Images",
    body: "Reduce unnecessary runtime components",
    imgSrc: "/images/cleanstart-images/perf-smaller-images.png",
    imgAlt: "3D icon representing image size reduction",
    imgStyle: { height: "104.52%", left: "8.15%", top: "-2.03%", width: "86.53%" },
    gap: 32,
  },
  {
    title: "Lower Memory Consumption",
    body: "Improve runtime efficiency.",
    imgSrc: "/images/cleanstart-images/perf-memory.png",
    imgAlt: "3D cloud icon representing memory efficiency",
    imgStyle: { height: "100.71%", left: "9.12%", top: "-0.71%", width: "83.45%" },
    gap: 16,
  },
  {
    title: "Faster Pull Times",
    body: "Accelerate deployments and scaling.",
    imgSrc: "/images/cleanstart-images/perf-pull-times.png",
    imgAlt: "3D box icon representing faster container pull times",
    imgStyle: { height: "117.27%", left: "8.45%", top: "-8.18%", width: "87.16%" },
    gap: 32,
  },
  {
    title: "Reduced Attack Surface",
    body: "Fewer inherited vulnerabilities and dependencies.",
    imgSrc: "/images/cleanstart-images/perf-attack-surface.png",
    imgAlt: "3D shield icon representing a reduced attack surface",
    imgStyle: { height: "96.83%", left: "15.93%", top: "1.36%", width: "72.54%" },
    gap: 16,
  },
];

export function CleanStartImagesUVP(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesPerformance"
      className="relative overflow-hidden bg-white"
    >
      {/* ── Decorative Union blob — top right ─────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1316px",
          top: "-534px",
          width: "1101px",
          height: "1101px",
        }}
        src="/images/cleanstart-images/uvp-blob-top-right.svg"
        alt=""
        loading="lazy"
        decoding="async"
      />

      {/* ── Decorative Union blob — bottom left ───────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-621px",
          top: "509px",
          width: "1181px",
          height: "1181px",
        }}
        src="/images/cleanstart-images/uvp-blob-bottom-left.svg"
        alt=""
        loading="lazy"
        decoding="async"
      />

      {/* ── Content wrapper (max 1440 px, 82 px side gutter at desktop) ───── */}
      <div
        className="relative mx-auto w-full"
        style={{ maxWidth: "1440px" }}
      >
        {/* ── Heading ───────────────────────────────────────────────────────── */}
        <div
          className="text-center px-5 sm:px-10"
          style={{ paddingTop: "120px" }}
        >
          <h2
            className="font-display inline"
            style={{
              fontSize: "var(--text-display-md)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {"Smaller Images. Lower "}
            <span className="cs-text-gradient-impact">Risk.</span>
          </h2>
          <p
            className="font-sans mt-6 mx-auto"
            style={{
              fontSize: "var(--text-body-xl)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.04em",
              color: "rgba(17,17,17,0.8)",
              maxWidth: "680px",
            }}
          >
            And remediation falls even further behind
          </p>
        </div>

        {/* ── 2 × 2 card grid with cross-hair dividers ─────────────────────── */}
        {/*
          Figma positions (1440 px frame):
            Cards row-1: top = 310 px, row-2: top = 627 px  → row gap = 97 px
            Vertical divider:   left = 720 px (50 %), h = 545 px
            Horizontal divider: top  = 578 px from section = ~50% of grid
        */}
        <div
          className="relative px-5 sm:px-10 lg:px-[82px]"
          style={{ marginTop: "67px", paddingBottom: "120px" }}
        >
          {/* Vertical divider — centered between columns */}
          <div
            aria-hidden
            className="hidden lg:block absolute pointer-events-none select-none"
            style={{
              left: "50%",
              transform: "translateX(-0.5px)",
              top: "0",
              width: "1px",
              height: "545px",
              zIndex: 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-images/uvp-divider-vertical.svg"
              alt=""
              aria-hidden
              style={{ width: "1px", height: "545px", display: "block" }}
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Horizontal divider — midpoint between row 1 and row 2 */}
          <div
            aria-hidden
            className="hidden lg:block absolute pointer-events-none"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              top: "50%",
              width: "calc(100% - 64px)",   /* span within the padding area */
              maxWidth: "1234px",
              height: "1px",
              marginTop: "-0.5px",
              background:
                "linear-gradient(90deg, transparent 0%, #d9d9d9 15%, #d9d9d9 85%, transparent 100%)",
              zIndex: 1,
            }}
          />

          {/* Card rows */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ rowGap: "97px", columnGap: "32px" }}
          >
            {CARDS.map((card) => (
              <div
                key={card.title}
                className="relative flex flex-col sm:flex-row items-center sm:items-center"
                style={{ gap: `${card.gap}px` }}
              >
                {/* ── Glow ellipse (sits behind the 3D icon) ──────────────── */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none select-none hidden sm:block"
                  style={{
                    left: "32px",
                    top: "12px",
                    width: "165px",
                    height: "165px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "-26.06%",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/cleanstart-images/uvp-card-glow.svg"
                      alt=""
                      style={{ width: "100%", height: "100%", display: "block" }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* ── 3D icon (296 × 220 overflow-hidden container) ───────── */}
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={{ width: "296px", height: "220px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.imgSrc}
                    alt={card.imgAlt}
                    className="absolute max-w-none pointer-events-none select-none"
                    style={card.imgStyle}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* ── Text block ──────────────────────────────────────────── */}
                <div
                  className="flex flex-col text-center sm:text-left"
                  style={{ gap: "23px" }}
                >
                  <h3
                    className="font-display"
                    style={{
                      fontSize: "var(--text-card-title-lg)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#111",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="font-sans"
                    style={{
                      fontSize: "var(--text-body-lg)",
                      fontWeight: 400,
                      lineHeight: 1.4,
                      letterSpacing: "-0.05em",
                      color: "#333",
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
