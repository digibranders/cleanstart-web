/**
 * Community / CTA — Footer slot content (Figma 732:4357, 1276×295).
 *
 * Renders inside the Footer's locked 1276×330 / radius-40 slot. Owns
 * only the fill, decorative cube, and copy/CTA. The wrapper is
 * `absolute inset-0` to fill the slot.
 */
export function CommunityCTA() {
  return (
    <div
      className="absolute inset-0 grid grid-cols-1 items-center gap-y-6 p-8 md:gap-y-0 md:p-12 lg:grid-cols-[440px_1fr_280px] lg:gap-x-[clamp(32px,6vw,90px)] lg:p-[clamp(28px,4.2vw,56px)_clamp(48px,7vw,122px)]"
      style={{
        background: "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)",
      }}
    >
      {/* Decorative radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-10%",
          top: "-30%",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(closest-side, rgba(127,82,255,0.45) 0%, rgba(127,82,255,0) 70%)",
        }}
      />

      <p
        className="relative z-10 font-display font-bold text-white"
        style={{
          maxWidth: "401px",
          fontSize: "var(--text-t-display-2, var(--text-display-md))",
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
        }}
      >
        Ready to secure the future?
      </p>

      <div className="relative z-10 flex flex-col items-start gap-6">
        <p
          className="font-sans font-normal text-white"
          style={{
            maxWidth: "493px",
            fontSize: "var(--text-body-lg)",
            lineHeight: 1.4,
            letterSpacing: "-0.025em",
            opacity: 0.85,
          }}
        >
          Join the community building the world&rsquo;s most trusted software ecosystem.
        </p>
        <a
          href="https://github.com/cleanstart"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-btn-glass"
          style={{
            ["--cs-btn-px" as string]: "18px",
            ["--cs-btn-fs" as string]: "18px",
            color: "#111111",
          }}
        >
          <span>Join the Community</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M3 9h11m0 0l-4-4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {/* 3-D cube — right side */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/community/cta-cube.png"
        alt=""
        className="pointer-events-none relative z-10 hidden select-none lg:block"
        style={{
          width: "260px",
          height: "auto",
          justifySelf: "end",
          transform: "rotate(-12deg)",
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
