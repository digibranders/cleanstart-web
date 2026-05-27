import Link from "next/link";

/**
 * News detail CTA — Figma 817:6078.
 * "Built. Tested. Trusted." — white bg + two #DF9BFF glow blobs (same pattern
 * as ASR CTA mobile) + Union hex pattern + purple 3D cubes top-right / bottom-left.
 */
export function NewsDetailCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#FFFFFF" }}
      aria-labelledby="news-cta-title"
    >
      {/* ── Top-left pink glow blob ──────────────────────────────────────────── */}
      {/* Figma mobile: left=-158px top=-134px size=223.44px #DF9BFF blur=53px */}
      <div
        aria-hidden
        className="pointer-events-none absolute lg:hidden"
        style={{
          left: "-158px",
          top: "-134px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      {/* Desktop: larger blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(100px)",
        }}
      />

      {/* ── Bottom-right pink glow blob ──────────────────────────────────────── */}
      {/* Figma mobile: left=250px top=166px in 328×248px → right≈-145px bottom≈-141px */}
      <div
        aria-hidden
        className="pointer-events-none absolute lg:hidden"
        style={{
          right: "-145px",
          bottom: "-141px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      {/* Desktop: larger blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-200px",
          bottom: "-180px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(100px)",
        }}
      />

      {/* ── Union hex pattern ────────────────────────────────────────────────── */}
      {/* Figma: left=55.5px top=54px size=378×378px */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/news-detail/cta-union.png"
        alt=""
        className="pointer-events-none select-none absolute"
        style={{
          left: "55.5px",
          top: "54px",
          width: "378px",
          height: "378px",
          objectFit: "contain",
          opacity: 0.12,
        }}
        loading="eager"
        decoding="async"
      />

      {/* ── Top-right purple cube ─────────────────────────────────────────────── */}
      {/* Mobile: 80px · Desktop: 120px */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/news-detail/cta-cube.png"
        alt=""
        className="pointer-events-none select-none absolute w-[80px] h-[80px] lg:w-[120px] lg:h-[120px]"
        style={{
          right: "-16px",
          top: "-20px",
          objectFit: "contain",
          opacity: 0.9,
          transform: "scaleY(-1) rotate(15deg)",
        }}
        loading="eager"
        decoding="async"
      />

      {/* ── Bottom-left purple cube ───────────────────────────────────────────── */}
      {/* Mobile: 80px · Desktop: 120px */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/news-detail/cta-cube.png"
        alt=""
        className="pointer-events-none select-none absolute w-[80px] h-[80px] lg:w-[120px] lg:h-[120px]"
        style={{
          left: "-21px",
          bottom: "-11px",
          objectFit: "contain",
          opacity: 0.9,
          transform: "rotate(165deg)",
        }}
        loading="eager"
        decoding="async"
      />

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-5 text-center">
        <h2
          id="news-cta-title"
          className="font-display font-bold relative z-10"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111111",
            maxWidth: "560px",
          }}
        >
          Built. Tested. Trusted.
        </h2>

        {/* Solid blue button — Figma: #3960F9 h=42px radius=8px */}
        <Link
          href="/contact-us"
          className="relative z-10 inline-flex items-center gap-2 font-sans font-medium text-white shrink-0"
          style={{
            background: "#3960F9",
            borderRadius: "8px",
            height: "44px",
            paddingLeft: "24px",
            paddingRight: "24px",
            fontSize: "16px",
            letterSpacing: "-0.05em",
            whiteSpace: "nowrap",
            boxShadow:
              "0px 1px 2px -1px rgba(9,6,63,0.4), 0px 0px 0px 1px #3960F9, inset 0px 1px 0px 0px rgba(255,255,255,0.16)",
          }}
        >
          <span>Get in Touch</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M3 9h11m0 0l-4-4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
