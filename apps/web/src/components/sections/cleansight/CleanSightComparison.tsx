import Image from "next/image";

const TRADITIONAL = [
  "Find container images",
  "Produce alert lists",
  "Require manual prioritization",
];

const CLEANSIGHT = [
  "Prioritize inherited risk",
  "Map runtime exposure",
  "Enable continuous remediation",
];

/*
 * Figma node 373:1168 — 1920px frame
 * Content-box offset: (1920-1276)/2 = 322px
 *
 * Card anatomy (section-absolute coords):
 *   Full card bg:  left=332/986, top=335, w=602, h=571, rounded-32
 *   Gradient img:  left=card-113, top=card-229, size=1028×1028
 *   White body:    top=465 (=335+130), h=299  ← only 299px, bottom 142px shows dark gradient
 *   Items list:    top=529 (=465+64), left=502/1156
 *   Header title:  centered in 0→130px of card
 *   Cyan glow:     left=322/976, top=324, w=622, h=458, opacity=0.4
 */

export function CleanSightComparison(): React.ReactElement {
  return (
    <section
      data-section="CleanSightComparison"
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "906px" }}
    >
      {/* ── Heading — top=80px, w=737px, centred ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: "80px", width: "min(737px, 90vw)" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            color: "#111",
          }}
        >
          Visibility Alone Doesn&apos;t{" "}
          <span
            style={{
              background:
                "linear-gradient(102.22deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Reduce Risk
          </span>
        </h2>
      </div>

      {/* ── Vertical separator — left=954px(≈50%), top=133px, h=90px ── */}
      <div
        aria-hidden
        className="absolute hidden xl:block pointer-events-none"
        style={{
          left: "50%",
          top: "133px",
          width: "1px",
          height: "90px",
          transform: "translateX(-0.5px)",
          background:
            "linear-gradient(179.47deg, rgba(217,217,217,0) 15.554%, rgb(217,217,217) 41.586%, rgba(217,217,217,0) 105.55%)",
        }}
      />

      {/* ════════════════ DESKTOP LAYOUT ════════════════ */}
      {/*
       * Container starts at section top=324px (where cyan glows live).
       * Cards are at top=11px within container (335-324=11).
       * VS badge at top=245px (569-324=245).
       */}
      <div
        className="absolute left-1/2 -translate-x-1/2 hidden xl:block"
        style={{ top: "324px", width: "1276px", height: "582px" }}
      >
        {/* ── Cyan glow behind left card — left=0, top=0, w=622, h=458, opacity=0.4 ── */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "0px",
            top: "0px",
            width: "622px",
            height: "458px",
            borderRadius: "40px",
            opacity: 0.4,
            background: "rgb(44, 193, 235)",
          }}
        />

        {/* ── Cyan glow behind right card — left=654px ── */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "654px",
            top: "0px",
            width: "622px",
            height: "458px",
            borderRadius: "40px",
            opacity: 0.4,
            background: "rgb(44, 193, 235)",
          }}
        />

        {/* ═══ LEFT CARD — Traditional Visibility Tools ═══
         *   Figma: left=332, top=335 → container-relative: left=10, top=11
         *   Full card bg = dark gradient (180°), overflow:hidden clips everything.
         *   Gradient overlay at left=-113, top=-229, 1028×1028.
         *   White body at top=130, h=299 — below it (142px) shows dark gradient.
         *   Items list: paddingLeft=170, paddingTop=64 (relative to white body top).
         */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: "10px",
            top: "11px",
            width: "602px",
            height: "571px",
            borderRadius: "32px",
          }}
        >
          {/* Full-card dark gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
            }}
          />

          {/* Gradient image overlay — left=-113 top=-229 size=1028×1028 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/cleansight/comp-gradient-left.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "-113px",
              top: "-229px",
              width: "1028px",
              height: "1028px",
              objectFit: "cover",
              maxWidth: "none",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Cyan flare at bottom of header */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "80px",
              transform: "translateX(-50%)",
              width: "500px",
              height: "120px",
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(44,193,235,0.28) 0%, transparent 70%)",
            }}
          />

          {/* Header title — centred in 0→130px */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: "0px", left: "0px", right: "0px", height: "130px" }}
          >
            <h3
              className="relative z-10 text-white text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 700,
                letterSpacing: "-1.6px",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              Traditional Visibility Tools
            </h3>
          </div>

          {/* White body — top=130px, h=299px exactly */}
          <div
            className="absolute bg-white"
            style={{
              top: "130px",
              left: "0px",
              right: "0px",
              height: "299px",
              paddingLeft: "170px",
              paddingRight: "40px",
              paddingTop: "64px",
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              boxShadow:
                "0px 120px 120px 0px rgba(223,155,255,0.08), 0px 64px 64px 0px rgba(22,34,51,0.12), 0px 32px 32px 0px rgba(22,34,51,0.04), 0px 24px 24px 0px rgba(22,34,51,0.04), 0px 4px 24px 0px rgba(22,34,51,0.04), 0px 4px 4px 0px rgba(22,34,51,0.04)",
            }}
          >
            {TRADITIONAL.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "24px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cleansight/comp-icon-traditional.svg"
                  alt=""
                  aria-hidden
                  style={{ width: "24px", height: "24px", flexShrink: 0 }}
                  loading="lazy"
                  decoding="async"
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    fontWeight: 600,
                    letterSpacing: "-1.1px",
                    lineHeight: 1.4,
                    color: "#333",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
          {/* Bottom 142px (430→571) shows dark gradient naturally */}
        </div>

        {/* ═══ RIGHT CARD — CleanSight ═══
         *   Figma: left=986, top=335 → container-relative: left=664, top=11
         *   Same layered structure; adds Vector diagonal (soft-light 0.34).
         */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: "664px",
            top: "11px",
            width: "602px",
            height: "571px",
            borderRadius: "32px",
          }}
        >
          {/* Full-card dark gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
            }}
          />

          {/* Gradient image overlay — left=-113 top=-229 size=1028×1028 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/cleansight/comp-gradient-right.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "-113px",
              top: "-229px",
              width: "1028px",
              height: "1028px",
              objectFit: "cover",
              maxWidth: "none",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Vector diagonal N-pattern — Figma: soft-light 0.34 opacity
           *  Section coords: left=1389.5, top=323.5, w=244, h=237
           *  Relative to this card (section left=986, top=335): left=403.5, top=-11.5
           */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/cleansight/comp-vector-right.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "404px",
              top: "-12px",
              width: "244px",
              height: "237px",
              mixBlendMode: "soft-light",
              opacity: 0.34,
              maxWidth: "none",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Header title — centred in 0→130px */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: "0px", left: "0px", right: "0px", height: "130px" }}
          >
            <h3
              className="relative z-10 text-white text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 700,
                letterSpacing: "-1.6px",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              CleanSight
            </h3>
          </div>

          {/* White body — top=130px, h=299px exactly */}
          <div
            className="absolute bg-white"
            style={{
              top: "130px",
              left: "0px",
              right: "0px",
              height: "299px",
              paddingLeft: "170px",
              paddingRight: "40px",
              paddingTop: "64px",
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              boxShadow:
                "0px 120px 120px 0px rgba(223,155,255,0.08), 0px 64px 64px 0px rgba(22,34,51,0.12), 0px 32px 32px 0px rgba(22,34,51,0.04), 0px 24px 24px 0px rgba(22,34,51,0.04), 0px 4px 24px 0px rgba(22,34,51,0.04), 0px 4px 4px 0px rgba(22,34,51,0.04)",
            }}
          >
            {CLEANSIGHT.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "24px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cleansight/comp-icon-cleansight.svg"
                  alt=""
                  aria-hidden
                  style={{ width: "30px", height: "26px", flexShrink: 0 }}
                  loading="lazy"
                  decoding="async"
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-1.1px",
                    lineHeight: 1.4,
                    color: "#333",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
          {/* Bottom 142px shows dark gradient naturally */}
        </div>

        {/* ── VS badge — section top=569 → container top=245, left=575 ── */}
        <div
          className="absolute z-10"
          style={{ left: "575px", top: "245px", width: "126px", height: "126px" }}
        >
          <Image
            src="/images/cleansight/vs-badge.png"
            alt="VS"
            fill
            className="object-contain"
            sizes="126px"
          />
        </div>
      </div>

      {/* ════════════════ MOBILE LAYOUT ════════════════ */}
      <div
        className="xl:hidden relative mx-auto max-w-[1276px] px-4 sm:px-6"
        style={{ paddingTop: "180px", paddingBottom: "60px" }}
      >
        {/* Traditional card */}
        <div className="overflow-hidden" style={{ borderRadius: "32px", marginBottom: "32px" }}>
          <div
            className="relative flex items-center justify-center"
            style={{
              height: "90px",
              overflow: "hidden",
              background:
                "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleansight/comp-gradient-left.png"
              alt=""
              className="absolute pointer-events-none select-none inset-0"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
              decoding="async"
            />
            <h3
              className="relative z-10 text-white text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 4vw, 28px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
              }}
            >
              Traditional Visibility Tools
            </h3>
          </div>
          <div className="bg-white flex flex-col" style={{ padding: "32px 28px", gap: "28px" }}>
            {TRADITIONAL.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "16px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cleansight/comp-icon-traditional.svg"
                  alt=""
                  aria-hidden
                  style={{ width: "24px", height: "24px", flexShrink: 0 }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 3.5vw, 20px)",
                    fontWeight: 600,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.4,
                    color: "#333",
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center py-4">
          <Image
            src="/images/cleansight/vs-badge.png"
            alt="VS"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        {/* CleanSight card */}
        <div className="overflow-hidden" style={{ borderRadius: "32px", marginTop: "32px" }}>
          <div
            className="relative flex items-center justify-center"
            style={{
              height: "90px",
              overflow: "hidden",
              background:
                "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleansight/comp-gradient-right.png"
              alt=""
              className="absolute pointer-events-none select-none inset-0"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
              decoding="async"
            />
            <h3
              className="relative z-10 text-white text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 4vw, 28px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
              }}
            >
              CleanSight
            </h3>
          </div>
          <div className="bg-white flex flex-col" style={{ padding: "32px 28px", gap: "28px" }}>
            {CLEANSIGHT.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "16px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cleansight/comp-icon-cleansight.svg"
                  alt=""
                  aria-hidden
                  style={{ width: "30px", height: "26px", flexShrink: 0 }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 3.5vw, 20px)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.4,
                    color: "#333",
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
