/**
 * Community page CTA — white card matching the CleanSight CTA style,
 * rendered inside the Footer's locked 1200px × 300px radius-40 slot.
 */
export function CommunityCTA() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Decorative radial-faded grid */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "547px", top: "-220px", width: "1101px", height: "1101px", opacity: 0.5 }}
        loading="lazy"
        decoding="async"
      />

      {/* Glow — top-left (mobile) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          left: "-158px", top: "-134px",
          width: "223.44px", height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      {/* Glow — top-left (desktop) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-139px", top: "-168px",
          width: "320px", height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 2,
        }}
      />

      {/* Glow — bottom-right (mobile) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          right: "-145px", bottom: "-141px",
          width: "223.44px", height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      {/* Glow — bottom-right (desktop) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "1159px", top: "244px",
          width: "511px", height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 1,
        }}
      />

      {/* Cube decoration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "-40px", bottom: "-40px",
          width: "220px", height: "220px",
          objectFit: "contain",
          opacity: 0.5,
          zIndex: 3,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Desktop content row */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 items-start lg:items-center"
        style={{
          paddingLeft: "clamp(28px, 4vw, 64px)",
          paddingRight: "clamp(28px, 4vw, 64px)",
          paddingTop: "clamp(20px, 3vw, 32px)",
          paddingBottom: "clamp(20px, 3vw, 32px)",
          columnGap: "clamp(32px, 5vw, 72px)",
        }}
      >
        <p
          className="font-display relative"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111111",
            textWrap: "balance",
            margin: 0,
            maxWidth: "min(460px, 100%)",
            zIndex: 2,
          }}
        >
          Ready to secure the future?
        </p>

        <div
          className="flex flex-col min-w-0 w-full"
          style={{ maxWidth: "420px", gap: "clamp(16px, 1.5vw, 24px)", zIndex: 2 }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(17, 17, 17, 0.8)",
              margin: 0,
            }}
          >
            Join the community building the world&apos;s most trusted software ecosystem.
          </p>
          <a
            href="https://www.linkedin.com/groups/18324021/"
            target="_blank"
            rel="noopener noreferrer"
            className="cs-btn-blue self-start flex items-center gap-2"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "16px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            Join the Community
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M3 9h11m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mobile layout */}
      <div
        className="md:hidden absolute inset-0 overflow-hidden flex flex-col items-center justify-center text-center"
        style={{ padding: "32px 28px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/vulnerability-remediation/cta-cube.webp"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: "-24px", bottom: "-24px",
            width: "120px", height: "120px",
            objectFit: "contain",
            opacity: 0.85,
            zIndex: 1,
          }}
          loading="lazy"
          decoding="async"
        />
        <p
          className="font-display"
          style={{
            position: "relative", zIndex: 2,
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            color: "#111111",
            margin: 0,
            maxWidth: "300px",
            textWrap: "balance",
          }}
        >
          Ready to secure the future?
        </p>
        <p
          style={{
            position: "relative", zIndex: 2,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "rgba(17, 17, 17, 0.8)",
            margin: "12px 0 24px 0",
            maxWidth: "290px",
          }}
        >
          Join the community building the world&apos;s most trusted software ecosystem.
        </p>
        <a
          href="https://www.linkedin.com/groups/18324021/"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-btn-blue flex items-center gap-2"
          style={
            {
              position: "relative", zIndex: 2,
              "--cs-btn-h": "44px",
              "--cs-btn-px": "20px",
              "--cs-btn-fs": "15px",
            } as React.CSSProperties
          }
        >
          Join the Community
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M3 9h11m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}
