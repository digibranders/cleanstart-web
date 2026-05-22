/**
 * Inner content for the Home page CTA, rendered inside the Footer's fixed
 * 1276×330 / radius-40 slot. The Footer owns the container, position, overlap,
 * and z-stacking. This component renders only the fill, decorative art, and
 * copy/CTA. The wrapper is `absolute inset-0` to fill the locked slot.
 */
export function ReadyToSecureCTA() {
  return (
    <div
      className="absolute inset-0 grid grid-cols-1 items-start gap-y-8 p-8 md:gap-y-0 md:p-12 lg:items-start lg:grid-cols-[minmax(280px,401px)_minmax(360px,493px)] lg:gap-x-[clamp(40px,9vw,115px)] lg:p-[clamp(40px,6vw,80px)_clamp(48px,10vw,145px)_clamp(40px,6vw,80px)_clamp(48px,8vw,122px)]"
      style={{
        background: "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)",
      }}
    >
      {/* Decorative purple radial blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-10%",
          top: "-30%",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(closest-side, rgba(127,82,255,0.55) 0%, rgba(127,82,255,0) 70%)",
        }}
      />

      <p
        id="cta-title"
        className="relative z-10 font-display font-bold text-white"
        style={{
          // Figma 1440 node 763:3053: Manrope Bold 55 px / lh 1.0 / -2.75 px / w-401
          maxWidth: "401px",
          fontSize: "clamp(1.75rem, 3.82vw, 3.4375rem)",
          lineHeight: 1,
          letterSpacing: "-0.05em",
        }}
      >
        Ready to Secure Your Container Infrastructure?
      </p>

      <div className="relative z-10 flex flex-col items-start gap-[18px]">
        <p
          className="font-normal text-white"
          style={{
            // Figma 1440 node 763:3054: Sora Regular 20 px / lh 1.4 / -0.8 px / opacity 0.8 / w-493
            maxWidth: "493px",
            fontSize: "20px",
            lineHeight: 1.4,
            letterSpacing: "-0.04em",
            opacity: 0.8,
          }}
        >
          Start with zero-CVE hardened images. Deploy faster with confidence
          knowing your containers are secured from the ground up.
        </p>
        <a
          href="#get-a-demo"
          className="cs-btn-glass"
          style={{
            ["--cs-btn-px" as string]: "18px",
            ["--cs-btn-fs" as string]: "18px",
          }}
        >
          <span>Get a Demo</span>
          <svg
            className="cs-cta-arrow"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
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
    </div>
  );
}
