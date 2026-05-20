import Image from "next/image";

/*
 * Figma node 373:1168 — 1920 px frame · content-box offset = 322 px
 *
 * Exact card layer order (both cards share the same z-stack):
 *  1. Dark gradient background   inset-0, rounded-32
 *  2. Gradient overlay image     left=-113 top=-229 1028×1028
 *  3. [Right only] Vector N      left=404 top=-12 soft-light 0.34
 *  4. White body panel           top=130 h=299 rounded-32 bg-white + shadow
 *  5. Large ellipse blob         container 364×364 @ card(−233, 322), inner 670×670
 *  6. Small ellipse blob         container 262×262 @ card(553, 407),  inner 748×748
 *  7. Items list                 absolute @ card(170, 194) flex-col gap-40
 *  8. Header title               absolute, centred in 0→130 px
 *
 * Gradient overlay mask: fades out at image-y 359→429 (= card-y 130→200) so
 * the bright lower-left area never bleeds into the card footer.
 *
 * Section has paddingBottom=80px so the card gradient footer (card-y 429–571)
 * doesn't slam directly against the dark stats section below.
 */

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

/* ─── shared shadow on white body panel ─── */
const WHITE_BODY_SHADOW =
  "0px 120px 120px 0px rgba(223,155,255,0.08)," +
  "0px 64px 64px 0px rgba(22,34,51,0.12)," +
  "0px 32px 32px 0px rgba(22,34,51,0.04)," +
  "0px 24px 24px 0px rgba(22,34,51,0.04)," +
  "0px 4px 24px 0px rgba(22,34,51,0.04)," +
  "0px 4px 4px 0px rgba(22,34,51,0.04)";

/* ─── base gradient — same for both cards; vibrancy comes from overlay image ─── */
const HEADER_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)";

function Card({
  title,
  items,
  gradient,
  iconSrc,
  fontWeight,
  vector = false,
  ellipseSmall,
  ellipseLarge,
  gradientFilter,
}: {
  title: string;
  items: string[];
  gradient: string;
  iconSrc: string;
  fontWeight: number;
  vector?: boolean;
  ellipseSmall: string;
  ellipseLarge: string;
  /** CSS filter applied to the gradient overlay — replicates Figma's
   *  mix-blend-mode:saturation boost layer (image 121). */
  gradientFilter?: string;
}) {
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        width: "602px",
        height: "571px",
        borderRadius: "32px",
        clipPath: "inset(0 round 32px)",
      }}
    >
      {/* ── 1. Dark gradient background ── */}
      <div className="absolute inset-0" style={{ background: HEADER_GRADIENT }} />

      {/* ── 2. Gradient overlay image — left=-113 top=-229 1028×1028 ──
       *  Mask fades the overlay out at the header/body boundary so the
       *  bright lower-left region of the image never bleeds into the
       *  card footer (card-y 429–571 = image-y 658–800).
       *  Fade window: image-y 359→429 = card-y 130→200 (top of white body).
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src={gradient}
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          left: "-113px",
          top: "-229px",
          width: "1028px",
          height: "1028px",
          maxWidth: "none",
          filter: gradientFilter,
          maskImage:
            "linear-gradient(to bottom, black 0%, black 359px, transparent 429px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 359px, transparent 429px)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── 3. [Right card] Vector N-pattern — soft-light 0.34 ── */}
      {vector && (
        // eslint-disable-next-line @next/next/no-img-element
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
      )}

      {/* ── 3b. Cyan flare — bright glow at bottom-centre of header ── */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: "-100px",
          top: "-43px",
          width: "631px",
          height: "177px",
          background:
            "radial-gradient(ellipse 315px 90px at 315px 177px," +
            "rgba(211,255,248,0.55) 0%," +
            "rgba(44,184,249,0.35) 10%," +
            "rgba(1,102,204,0.15) 40%," +
            "rgba(1,60,125,0.05) 65%," +
            "transparent 80%)",
        }}
      />

      {/* ── 4. White body panel — top=130 h=299 (Figma spec) ── */}
      <div
        className="absolute bg-white overflow-hidden"
        style={{
          top: "130px",
          left: "0px",
          right: "0px",
          height: "299px",
          borderRadius: "32px",
          boxShadow: WHITE_BODY_SHADOW,
        }}
      >
        {/* ── 5. Large ellipse blob ──
         *  Figma: section(753,657) → card(−233,322) → white-body(−233,192)
         *  Container 364×364; inner SVG 670×670 via inset=−153px
         */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ left: "-233px", top: "192px", width: "364px", height: "364px" }}
        >
          <div className="absolute" style={{ top: "-153px", right: "-153px", bottom: "-153px", left: "-153px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ellipseLarge}
              alt=""
              style={{ display: "block", width: "670px", height: "670px", maxWidth: "none" }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* ── 6. Small ellipse blob ──
         *  Figma: section(1539,742) → card(553,407) → white-body(553,277)
         *  Container 262×262; inner SVG 748×748 via inset=−243px
         */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ left: "553px", top: "277px", width: "262px", height: "262px" }}
        >
          <div className="absolute" style={{ top: "-243px", right: "-243px", bottom: "-243px", left: "-243px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ellipseSmall}
              alt=""
              style={{ display: "block", width: "748px", height: "748px", maxWidth: "none" }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* ── 7. Items list ──
         *  Figma: section(502/1156, 529) → card(170,194) → white-body(170,64)
         */}
        <div
          className="absolute flex flex-col"
          style={{ left: "170px", top: "64px", gap: "40px" }}
        >
          {items.map((item) => (
            <div key={item} className="flex items-center" style={{ gap: "24px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconSrc}
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
                  fontWeight,
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
      </div>

      {/* ── 8. Header title — centred in 0→130 px ── */}
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
          {title}
        </h3>
      </div>
    </div>
  );
}

export function CleanSightComparison(): React.ReactElement {
  return (
    <section
      data-section="CleanSightComparison"
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "0" }}
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

      {/* ── Vertical separator — left≈50%, top=133px, h=90px ── */}
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

      {/* ════════════════════════ DESKTOP ════════════════════════ */}
      <div
        className="absolute left-1/2 -translate-x-1/2 hidden xl:block"
        style={{ top: "324px", width: "1276px", height: "582px" }}
      >
        {/* ── Cyan glow behind left card ── */}
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

        {/* ── Cyan glow behind right card ── */}
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

        {/* ── Left card — Traditional ── */}
        <div className="absolute" style={{ left: "10px", top: "11px" }}>
          <Card
            title="Traditional Visibility Tools"
            items={TRADITIONAL}
            gradient="/images/cleansight/comp-gradient-left.png"
            iconSrc="/images/cleansight/comp-icon-traditional.svg"
            fontWeight={600}
            ellipseSmall="/images/cleansight/comp-ellipse-small-left.svg"
            ellipseLarge="/images/cleansight/comp-ellipse-large-left.svg"
          />
        </div>

        {/* ── Right card — CleanSight ── */}
        <div className="absolute" style={{ left: "664px", top: "11px" }}>
          <Card
            title="CleanSight"
            items={CLEANSIGHT}
            gradient="/images/cleansight/comp-gradient-right.png"
            iconSrc="/images/cleansight/comp-icon-cleansight.svg"
            fontWeight={700}
            vector
            ellipseSmall="/images/cleansight/comp-ellipse-small-right.svg"
            ellipseLarge="/images/cleansight/comp-ellipse-large-right.svg"
            gradientFilter="saturate(2.4) brightness(1.15)"
          />
        </div>

        {/* ── VS badge ── */}
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

      {/* ── Natural height spacer — forces section to 1040 px so the card
       *  gradient footer (card-y 429–571) doesn't slam against the dark stats
       *  section. All card content is absolute so this div IS the section height. */}
      <div aria-hidden className="invisible xl:block hidden" style={{ height: "1040px" }} />
      <div aria-hidden className="invisible xl:hidden block" style={{ height: "10px" }} />

      {/* ════════════════════════ MOBILE ════════════════════════ */}
      <div
        className="xl:hidden relative mx-auto max-w-[1276px] px-4 sm:px-6"
        style={{ paddingTop: "180px", paddingBottom: "60px" }}
      >
        {/* Traditional card */}
        <div className="overflow-hidden" style={{ borderRadius: "32px", marginBottom: "32px" }}>
          <div
            className="relative flex items-center justify-center"
            style={{ height: "90px", overflow: "hidden", background: HEADER_GRADIENT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleansight/comp-gradient-left.png"
              alt=""
              className="absolute inset-0 pointer-events-none select-none"
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
            style={{ height: "90px", overflow: "hidden", background: HEADER_GRADIENT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleansight/comp-gradient-right.png"
              alt=""
              className="absolute inset-0 pointer-events-none select-none"
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(2.4) brightness(1.15)" }}
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
