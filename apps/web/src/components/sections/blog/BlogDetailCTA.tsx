import type React from "react";

/**
 * Inner content for the Blog/News detail CTA, rendered inside the Footer's
 * fixed 1276×330 / radius-40 slot.
 */
export function BlogDetailCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: "#fff", padding: "80px 100px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-union.svg"
        alt=""
        className="pointer-events-none select-none absolute"
        style={{ left: "547px", top: "-220px", width: "1101px", height: "1101px" }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-union.svg"
        alt=""
        className="pointer-events-none select-none absolute"
        style={{ left: "-496px", top: "-239px", width: "1101px", height: "1101px" }}
        loading="lazy"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute rounded-full"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(243px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute rounded-full"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(243px)",
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-cube.png"
        alt=""
        className="pointer-events-none select-none absolute object-contain"
        style={{
          left: "-90px",
          top: "214px",
          width: "259px",
          height: "260px",
          transform: "rotate(-15deg)",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blog-detail/cta/cta-cube.png"
        alt=""
        className="pointer-events-none select-none absolute object-contain"
        style={{
          left: "1130px",
          top: "-63px",
          width: "259px",
          height: "260px",
          transform: "rotate(-15deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="relative z-10 flex flex-col items-center"
        style={{ gap: "32px", width: "634px", maxWidth: "100%" }}
      >
        <h2
          className="font-display text-display-lg font-bold leading-none tracking-[-0.05em] text-center"
          style={{ color: "#111111" }}
        >
          Built. Tested. Trusted.
        </h2>

        <button
          type="button"
          className="cs-btn-blue relative overflow-hidden gap-2"
          style={{
            width: "168px",
            height: "44px",
            padding: "0 14px",
            fontSize: "1.125rem",
          }}
        >
          <span style={{ position: "relative", zIndex: 1 }}>Get in Touch</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/blog-detail/cta/cta-arrow.svg"
            alt=""
            aria-hidden
            width={25}
            height={22}
            style={{ display: "block", position: "relative", zIndex: 1 }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "calc(50% + 3.2px)",
              top: "41.1px",
              width: "30.073px",
              height: "30.073px",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.6)",
              borderRadius: "50%",
              filter: "blur(10px)",
              pointerEvents: "none",
            }}
          />
        </button>
      </div>
    </div>
  );
}
