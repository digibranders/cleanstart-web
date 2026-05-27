import type React from "react";

/*
 * Figma node 583:2596 — 1920×~720px, white background
 *
 * Corner decorations (absolute, relative to section):
 *   Right Union: right=-185px, top=-193px, 488×496px, rotate(141.39deg) scaleY(-1)
 *   Left  Union: left=-218px,  top=-139px, 488×496px, rotate(141.39deg) scaleY(-1)
 *   Right Ellipse: right=-127px, top=-74px, 315×315px (SVG overflows via -64.44% inset)
 *   Left  Ellipse: left=-103px,  top=-20px, 315×315px
 *
 * Heading: 62px Manrope Bold, centered, #111, tracking -0.05em, lineHeight 1, maxW 654px
 *   "Environments" → gradient(100.87°, #9A51FF → #2CC1EB)
 *   marginBottom: 74px
 *
 * 4 Cards — 4×295 + 3×32 = 1276px; container has NO horizontal padding
 *   Outer: 295×324px, borderRadius 40px, bg #2cc1eb opacity 0.3 (cyan glow border)
 *   Inner: 287×316px (inset 4px), borderRadius 36px, bg white, overflow hidden
 *   Decoratives inside inner:
 *     • Purple blur: top=28px, centered, 263×153px, #df9bff, blur(66.5px), opacity 0.3
 *     • H-lines: y=68 and y=184, 1px, white gradient, opacity 0.3
 *     • V-lines: x=48.47, 120.03, 162.38, 233.94; h=264px, 0.73px, opacity 0.8
 *   Ball: 96×96px circle, bg linear-gradient(180°,#239cff→#005be3)
 *     top-edge at 33px (centered horizontally)
 *     Icon: 54×54px centered inside ball
 *   Text block: top=136px (moved up 16px from Figma 152px for 180px clearance),
 *               left=24px, width=251px, gap 12px
 *     Title: Manrope Bold, titleSize px (32 or 29), tracking -0.05em, #111, lh 1
 *     Desc:  Sora Regular 20px, tracking -0.05em, #555, lh 1.4
 *
 * Section: paddingTop 120px, paddingBottom 80px
 */

interface CardDef {
  icon: string;
  title: string;
  desc: string;
  titleSize: number;
}

const CARDS: CardDef[] = [
  {
    icon: "/images/ciso/enterprise-icon-cloud.svg",
    title: "Multi-Cloud Environments",
    desc: "Support modern infrastructure deployments.",
    titleSize: 32,
  },
  {
    icon: "/images/ciso/enterprise-icon-devsecops.svg",
    title: "DevSecOps Teams",
    desc: "Reduce remediation overhead across teams.",
    titleSize: 32,
  },
  {
    icon: "/images/ciso/enterprise-icon-compliance.svg",
    title: "Compliance Programs",
    desc: "Support software supply chain governance.",
    titleSize: 32,
  },
  {
    icon: "/images/ciso/enterprise-icon-security-ops.svg",
    title: "Enterprise Security Operations",
    desc: "Improve visibility into inherited software risk.",
    titleSize: 29,
  },
];

// ─── Desktop card ─────────────────────────────────────────────────────────────
function EnterpriseCard({ icon, title, desc, titleSize }: CardDef): React.ReactElement {
  return (
    /* Outer: 295×324px, cyan glow at 30% opacity behind inner white card */
    <div className="relative flex-shrink-0" style={{ width: "295px", height: "324px" }}>
      {/* Outer cyan glow — creates the border halo effect */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "40px", background: "#2cc1eb", opacity: 0.3 }}
      />

      {/* Inner white card: 287×316px (4px inset on each side) */}
      <div
        className="absolute overflow-hidden bg-white"
        style={{ inset: "4px", borderRadius: "36px" }}
      >
        {/* Purple blur at top */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "263px",
            height: "153px",
            background: "#df9bff",
            filter: "blur(66.5px)",
            opacity: 0.3,
          }}
        />

        {/* Horizontal grid lines at y=68 and y=184 */}
        {([68, 184] as const).map((y) => (
          <div
            key={y}
            aria-hidden
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${y}px`,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 50.77%, transparent 100%)",
              opacity: 0.3,
            }}
          />
        ))}

        {/* Vertical accent lines at Figma x positions */}
        {([48.47, 120.03, 162.38, 233.94] as const).map((x) => (
          <div
            key={x}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: `${x}px`,
              top: 0,
              width: "0.73px",
              height: "264px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,1) 50.77%, transparent 100%)",
              opacity: 0.8,
            }}
          />
        ))}

        {/* Blue gradient ball — top=33px, left=24px (left-aligned, matching text block) */}
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: "24px",
            top: "33px",
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 6.171px 14.537px 0px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            aria-hidden
            style={{ width: "54px", height: "54px", objectFit: "contain" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text block — top=152px (Figma spec: 24px gap below ball bottom at 129px) */}
        <div
          className="absolute flex flex-col"
          style={{ top: "152px", left: "24px", width: "251px", gap: "12px" }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: `${titleSize}px`,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#111",
              margin: 0,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(14px, 1.04vw, 20px)",
              fontWeight: 400,
              letterSpacing: "-0.05em",
              lineHeight: 1.4,
              color: "#555",
              margin: 0,
            }}
          >
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CisoEnterprise(): React.ReactElement {
  return (
    <section
      data-section="CisoEnterprise"
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: "120px", paddingBottom: "var(--spacing-section-cta)" }}
    >
      {/* ── Corner Union — top-right ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: "-185px",
          top: "-193px",
          width: "488px",
          height: "496px",
          transform: "rotate(141.39deg) scaleY(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Corner Union — top-left ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "-218px",
          top: "-139px",
          width: "488px",
          height: "496px",
          transform: "rotate(141.39deg) scaleY(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Ellipse glow — top-right ── */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ right: "-127px", top: "-74px", width: "315px", height: "315px" }}
      >
        <div className="absolute" style={{ inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ciso/enterprise-ellipse.svg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "fill" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Ellipse glow — top-left ── */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-103px", top: "-20px", width: "315px", height: "315px" }}
      >
        <div className="absolute" style={{ inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ciso/enterprise-ellipse.svg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "fill" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Heading — padded container so text has safe margins ── */}
      <div className="relative mx-auto px-6 sm:px-10" style={{ maxWidth: "1276px" }}>
        <h2
          className="text-center mx-auto"
          style={{
            maxWidth: "654px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#111",
            marginBottom: "74px",
          }}
        >
          Built for Enterprise{" "}
          <span
            style={{
              background:
                "linear-gradient(100.87deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Environments
          </span>
        </h2>
      </div>

      {/* ── Card container — NO horizontal padding so 4×295+3×32=1276px fills exactly ── */}
      <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

        {/* ════ DESKTOP — 4 cards in a flex row, centered ════ */}
        <div
          className="hidden xl:flex items-start justify-center"
          style={{ gap: "32px" }}
        >
          {CARDS.map((card) => (
            <EnterpriseCard key={card.title} {...card} />
          ))}
        </div>

        {/* ════ MOBILE — 1-col stack ════
             Figma 856:1367 — cards 328×238px (10px margin each side in 360px)
             Ball: 70×70px centered, top=20px
             Icon: 40×40px inside ball
             Text block: top=108px, centered, title 20px Bold, desc 14px Regular */}
        <div className="xl:hidden flex flex-col gap-4 px-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="relative flex-shrink-0"
              style={{ height: "238px" }}
            >
              {/* Outer cyan glow border */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ borderRadius: "40px", background: "#2cc1eb", opacity: 0.3 }}
              />
              {/* Inner white card: 6px inset */}
              <div
                className="absolute overflow-hidden bg-white"
                style={{ inset: "6px", borderRadius: "34px" }}
              >
                {/* Purple blur at top */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "180px",
                    height: "100px",
                    background: "#df9bff",
                    filter: "blur(50px)",
                    opacity: 0.3,
                  }}
                />

                {/* Blue gradient ball — 70×70px, centered, top=20px */}
                <div
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{
                    left: "50%",
                    top: "20px",
                    transform: "translateX(-50%)",
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                    boxShadow:
                      "0px 4.5px 10.6px 0px rgba(28,60,142,0.33), inset 0px -0.17px 0.21px 0px rgba(0,44,179,0.5), inset 0px 0.085px 0.425px 0px rgba(255,255,255,0.81)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.icon}
                    alt=""
                    aria-hidden
                    style={{ width: "40px", height: "40px", objectFit: "contain" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Text block — centered, top=108px */}
                <div
                  className="absolute flex flex-col items-center text-center"
                  style={{
                    top: "108px",
                    left: "16px",
                    right: "16px",
                    gap: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: `${card.titleSize > 30 ? 20 : 18}px`,
                      fontWeight: 700,
                      letterSpacing: "-0.05em",
                      lineHeight: 1.1,
                      color: "#111",
                      margin: 0,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      fontWeight: 400,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.4,
                      color: "#555",
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
