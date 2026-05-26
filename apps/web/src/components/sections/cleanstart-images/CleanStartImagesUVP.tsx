import type React from "react";

type CardData = {
  title: string;
  body: string;
  imgSrc: string;
  imgAlt: string;
  /** Exact percentage offsets of the rendered image inside its overflow-hidden container */
  imgStyle: React.CSSProperties;
  /** gap between image container and text block (px) — desktop only */
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

/**
 * Mobile UVP card — Figma 856:661
 * 328×206 px card, white bg, cyan glow border, rounded-16
 * Icon (85 px tall) + glow ellipse centered at top, text centered below at 112 px
 */
function MobileUVPCard({ card }: { card: CardData }): React.ReactElement {
  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: "328px",
        height: "206px",
        borderRadius: "16px",
        background: "white",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 0 0 1.5px rgba(44,193,235,0.22), 0 6px 24px rgba(44,193,235,0.14), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Icon container — 108×87 px, centered, top 14 px */}
      <div
        className="absolute"
        style={{
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "108px",
          height: "87px",
        }}
      >
        {/* Glow ellipse — 79.75 px, inset -26.06 % (Figma imgEllipse46679) */}
        <div
          aria-hidden
          className="pointer-events-none select-none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "79.75px",
            height: "79.75px",
            zIndex: 0,
          }}
        >
          <div style={{ position: "absolute", inset: "-26.06%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-images/uvp-card-glow.svg"
              alt=""
              aria-hidden
              style={{ width: "100%", height: "100%", display: "block" }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* 3D icon — 85 px tall, centered */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imgSrc}
          alt={card.imgAlt}
          className="absolute pointer-events-none select-none"
          style={{
            height: "85px",
            width: "auto",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text block — top 112 px, left/right 16 px, centered, gap 12 px */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{
          top: "112px",
          left: "16px",
          right: "16px",
          gap: "12px",
        }}
      >
        <h3
          className="font-display"
          style={{
            fontSize: "var(--text-card-title-md)",
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
            fontSize: "var(--text-body-sm)",
            fontWeight: 400,
            lineHeight: 1.4,
            color: "rgba(17,17,17,0.8)",
            letterSpacing: "-0.02em",
          }}
        >
          {card.body}
        </p>
      </div>
    </div>
  );
}

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

      {/* ── Content wrapper (max 1440 px) ──────────────────────────────────── */}
      <div className="relative mx-auto w-full" style={{ maxWidth: "1440px" }}>
        {/*
         * ═══════════════════════════════════════════════════════════════════
         * MOBILE layout — hidden at lg+ (Figma node 856:661)
         * ═══════════════════════════════════════════════════════════════════
         */}
        <div
          className="lg:hidden flex flex-col items-center px-6"
          style={{ paddingTop: "64px", paddingBottom: "64px" }}
        >
          {/* Mobile heading — 28 px bold, max-w 240 px, centered */}
          <h2
            className="font-display text-center"
            style={{
              fontSize: "var(--text-display-sm)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
              color: "#111",
              maxWidth: "240px",
            }}
          >
            {"Smaller Images. Lower "}
            <span
              style={{
                background:
                  "linear-gradient(97.32deg, #9A51FF 26.48%, #2CC1EB 98.78%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Risk.
            </span>
          </h2>

          {/* Mobile subtitle — 14 px, medium, opacity-80, max-w 160 px */}
          <p
            className="font-sans text-center mt-3 mx-auto"
            style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "rgba(17,17,17,0.8)",
              letterSpacing: "-0.04em",
              maxWidth: "160px",
            }}
          >
            And remediation falls even further behind
          </p>

          {/* Mobile card stack — 4 cards, gap 16 px */}
          <div
            className="mt-10 w-full flex flex-col items-center"
            style={{ gap: "16px" }}
          >
            {CARDS.map((card) => (
              <MobileUVPCard key={card.title} card={card} />
            ))}
          </div>
        </div>

        {/*
         * ═══════════════════════════════════════════════════════════════════
         * DESKTOP layout — hidden below lg
         * ═══════════════════════════════════════════════════════════════════
         */}
        <div className="hidden lg:block">
          {/* ── Heading ─────────────────────────────────────────────────── */}
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

          {/* ── 2×2 card grid with cross-hair dividers ───────────────────── */}
          <div
            className="relative px-5 sm:px-10 lg:px-[82px]"
            style={{ marginTop: "67px", paddingBottom: "120px" }}
          >
            {/* Vertical divider — centered between columns */}
            <div
              aria-hidden
              className="absolute pointer-events-none select-none"
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
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "50%",
                width: "calc(100% - 64px)",
                maxWidth: "1234px",
                height: "1px",
                marginTop: "-0.5px",
                background:
                  "linear-gradient(90deg, transparent 0%, #d9d9d9 15%, #d9d9d9 85%, transparent 100%)",
                zIndex: 1,
              }}
            />

            {/* Card rows — always 2-col since this block is lg+ only */}
            <div
              className="grid grid-cols-2"
              style={{ rowGap: "97px", columnGap: "32px" }}
            >
              {CARDS.map((card) => (
                <div
                  key={card.title}
                  className="relative flex flex-row items-center"
                  style={{ gap: `${card.gap}px` }}
                >
                  {/* ── Glow ellipse (sits behind the 3D icon) ─────────── */}
                  <div
                    aria-hidden
                    className="absolute pointer-events-none select-none"
                    style={{
                      left: "32px",
                      top: "12px",
                      width: "165px",
                      height: "165px",
                    }}
                  >
                    <div style={{ position: "absolute", inset: "-26.06%" }}>
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

                  {/* ── 3D icon (296×220 overflow-hidden container) ─────── */}
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

                  {/* ── Text block ──────────────────────────────────────── */}
                  <div className="flex flex-col text-left" style={{ gap: "23px" }}>
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
      </div>
    </section>
  );
}
