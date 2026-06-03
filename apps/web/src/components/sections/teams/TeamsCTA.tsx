/**
 * Inner content for the Teams page CTA, rendered inside the Footer's
 * 1276×330 slot (overflow-hidden, border-radius 40px). The 3-D cube overflows
 * the card top and is clipped by the Footer's overflow-hidden.
 */
export function TeamsCTA() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
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

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
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

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
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
         opacity: 0.75,}}
        loading="lazy"
        decoding="async"
      />

      <div className="absolute inset-x-6 inset-y-0 flex flex-col items-center justify-center gap-4 text-center md:inset-auto md:left-[clamp(24px,45%,547px)] md:top-1/2 md:-translate-y-1/2 md:items-start md:text-left md:w-[min(607px,calc(100%-clamp(24px,45%,547px)-24px))]">
        <p
          className="font-display font-bold text-[#111]"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          Join the Team
        </p>

        <div className="flex flex-col gap-10 items-center md:items-start">
          <p
            className="font-sans text-[#111]/80 whitespace-normal md:whitespace-nowrap"
            style={{
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
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
              fontSize: "var(--fs-lead)",
              letterSpacing: "-0.01em",
              borderRadius: "8px",
              background:
                "linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)",
              boxShadow:
                "0 0 0 1px #3960F9, 0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 0 rgba(255,255,255,0.16)",
            }}
          >
            {/* Bottom-center white glow */}
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
