import type React from "react";

export function BlogDetailCTA(): React.ReactElement {
  return (
    <section className="relative w-full pt-[0px] pb-[28px] mb-[-165px]">
      <div className="relative px-6">
        <div className="relative z-20 mx-auto w-full max-w-[1276px]">
          {/* Figma 330:1276 — white card, 1276×375px, radius 40, padding 80px 100px */}
          <div
            className="relative overflow-hidden flex items-center justify-center"
            style={{
              background: "#fff",
              borderRadius: "40px",
              padding: "80px 100px",
              height: "330px",
            }}
          >
            {/* Union 1 — Figma 330:1277, x=547 y=-220, 1101×1101, opacity 0.08 */}
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
            {/* Union 2 — Figma 330:1278, x=-496 y=-239, 1101×1101, opacity 0.08 */}
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

            {/* Ellipse glow 1 — Figma 330:1279, x=1159 y=244, 511×511, #DF9BFF, blur 243, opacity 0.8 */}
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
            {/* Ellipse glow 2 — Figma 330:1280, x=-139 y=-168, 320×320, #DF9BFF, blur 243, opacity 0.8 */}
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

            {/* Cube left — Figma 330:1292, x=-90 y=214, 259×260, rotate -15deg */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/blog-detail/cta/cta-cube.png"
              alt=""
              className="pointer-events-none select-none absolute object-contain"
              style={{ left: "-90px", top: "214px", width: "259px", height: "260px", transform: "rotate(-15deg)" }}
              loading="lazy"
              decoding="async"
            />
            {/* Cube right — Figma 330:1293, x=1130 y=-63, 259×260, rotate -15deg */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/blog-detail/cta/cta-cube.png"
              alt=""
              className="pointer-events-none select-none absolute object-contain"
              style={{ left: "1130px", top: "-63px", width: "259px", height: "260px", transform: "rotate(-15deg)" }}
              loading="lazy"
              decoding="async"
            />

            {/* Content — Figma 330:1281, column, alignItems center, gap 32, width 634 */}
            <div
              className="relative z-10 flex flex-col items-center"
              style={{ gap: "32px", width: "634px", maxWidth: "100%" }}
            >
              {/* Title — Figma 330:1282, Manrope Bold 72px, #111, ls -5%, lh 100% */}
              <h2
                className="font-display text-display-lg font-bold leading-none tracking-[-0.05em] text-center"
                style={{ color: "#111111" }}
              >
                Built. Tested. Trusted.
              </h2>

              {/* Button — Figma 330:1283, 168×44, radius 8, bg #3960F9, overflow clip */}
              <button
                type="button"
                className="cs-btn-blue relative overflow-hidden gap-2"
                style={{ width: "168px", height: "44px", padding: "0 14px", fontSize: "1.125rem" }}
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
                {/* Glow — Figma 330:1291, #FFFFFF 60%, layer blur, 30.07×30.07 at top=41.1px centered */}
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
        </div>
      </div>
    </section>
  );
}
