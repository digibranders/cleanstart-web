import Link from "next/link";

/**
 * News detail CTA — Figma 817:6078 (Newsroom Detail Mobile / Desktop).
 *
 * "Built. Tested. Trusted." card with a single primary "Get in Touch" CTA.
 * Sits inside the shared Footer cta slot (1276×330 / 40-radius white card).
 */
export function NewsDetailCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0"
      style={{ background: "white" }}
      aria-labelledby="news-cta-title"
    >
      {/* Decorative cubes — desktop only, top-right + bottom-left. */}
      {/* Decorative cubes — visible from mobile per Figma 926:6086-6088
          (Newsroom Detail Mobile). Scale up at xl+ to the desktop placement. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          right: "-30px",
          top: "-20px",
          width: "120px",
          height: "120px",
          transform: "rotate(-15deg)",
          opacity: 0.55,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/cta-cube-right.png"
          alt=""
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-30px",
          bottom: "-20px",
          width: "120px",
          height: "120px",
          transform: "rotate(12deg)",
          opacity: 0.55,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/cta-cube-left.png"
          alt=""
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-10 lg:px-[100px] lg:py-[60px] gap-6 lg:gap-8 text-center">
        <h2
          id="news-cta-title"
          className="font-display font-bold"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111",
            maxWidth: "560px",
          }}
        >
          Built. Tested. Trusted.
        </h2>

        <Link
          href="/contact-us"
          className="cs-btn-blue relative overflow-hidden gap-2"
          style={{ padding: "0 20px" }}
        >
          <span
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              width: "30.07px",
              height: "30.07px",
              left: "calc(50% - 30.07px/2 - 2.3px)",
              top: "41.1px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.6)",
              filter: "blur(10.0245px)",
            }}
          />
          Get in Touch
          <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden>
            <path
              d="M4 10h14M12 4l6 6-6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
