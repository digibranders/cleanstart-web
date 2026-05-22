/**
 * Inner content for the Teams page CTA, rendered inside the Footer's
 * 1276×330 slot (overflow-hidden, border-radius 40px).
 *
 * Figma 583:4213 — white card with Union grid + two #DF9BFF corner ellipses,
 * 3-D cube on the left, "Join the Team" copy + solid-gradient Careers button
 * on the right. Cube overflows card top — clipped by Footer's overflow-hidden.
 */
export function TeamsCTA() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      {/* ── Union gridlines — visible at md+ ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden md:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Ellipse — top-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* ── Ellipse — bottom-right ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* 3-D cube — height = full card height, width derived by image's own
          aspect ratio. Fully visible, no clipping. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/teams/cta-cube.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "clamp(20px, 3vw, 50px)",
          bottom: "-120px",
          height: "130%",
          width: "auto",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Text content */}
      <div
        className="absolute flex flex-col gap-4"
        style={{
          left: "clamp(24px, 45%, 547px)",
          top: "50%",
          transform: "translateY(-50%)",
          width: "min(607px, calc(100% - clamp(24px, 45%, 547px) - 24px))",
        }}
      >
        <p
          className="font-display font-bold text-[#111]"
          style={{
            fontSize: "var(--text-t-display-2)",
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
          }}
        >
          Join the Team
        </p>

        <div className="flex flex-col gap-10">
          <p
            className="font-sans text-[#111]/80"
            style={{
              fontSize: "var(--text-t-body-lg)",
              letterSpacing: "var(--text-t-body-lg-ls)",
              lineHeight: "var(--text-t-body-lg-lh)",
              whiteSpace: "nowrap",
            }}
          >
            Visit our career page to explore open opportunities
          </p>

          <a
            href="/careers"
            className="relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden font-medium text-white"
            style={{
              width: "136px",
              height: "44px",
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
              borderRadius: "8px",
              background:
                "linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)",
              boxShadow:
                "0 0 0 1px #3960F9, 0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 0 rgba(255,255,255,0.16)",
            }}
          >
            {/* Bottom-center white glow — Figma Ellipse 3938 */}
            <span
              aria-hidden
              className="pointer-events-none select-none absolute"
              style={{
                width: "30.07px",
                height: "30.07px",
                left: "calc(50% - 30.07px/2 - 2.3px)",
                top: "41.1px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                filter: "blur(20.0489px)",
              }}
            />
            <span style={{ position: "relative", zIndex: 1 }}>Careers</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              style={{ position: "relative", zIndex: 1 }}
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
