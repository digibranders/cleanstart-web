import Image from "next/image";

/**
 * Kubr bird — escapes the CTA card's overflow:hidden so it peeks above the
 * card top edge per the Figma reference. Passed to `<Footer ctaOverlay=...>`,
 * which renders it on top of the clipped CTA surface.
 */
export function ReadyToSecureCTAOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10"
      style={{
        left: "clamp(20px, 5vw, 63px)",
        top: "clamp(-154px, -10vw, -90px)",
        width: "clamp(180px, 18vw, 304px)",
        aspectRatio: "304 / 206",
      }}
    >
      <Image
        src="/images/cta-kubr.png"
        alt=""
        width={304}
        height={206}
        sizes="304px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

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

      <h2
        id="cta-title"
        className="relative z-10 font-display text-display-sm font-bold leading-none tracking-[-0.05em] text-white"
        style={{ maxWidth: "401px" }}
      >
        Ready to Secure Your Container Infrastructure?
      </h2>

      <div className="relative z-10 flex flex-col items-start gap-[18px]">
        <p
          className="text-body-lg font-normal leading-[1.4] tracking-[-0.04em] text-white/80"
          style={{ maxWidth: "493px" }}
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
