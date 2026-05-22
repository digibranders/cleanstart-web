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
 * Heading: 62px Manrope Bold, centered, #111, tracking -0.05em, maxW 654px
 *   "Environments" → gradient(100.87°, #9A51FF → #2CC1EB)
 *   marginBottom: 74px (cards start at 318px in 1920px frame; heading top=120px)
 *
 * 4 Cards — same 295+32 gap = 1276px fill, identical to CisoOutcomes layout
 *   Outer: 295×324px, borderRadius 40px, bg #2cc1eb opacity 0.3 (cyan glow border)
 *   Inner: 287×316px (inset 4px), borderRadius 36px, bg white, overflow hidden
 *   Decoratives inside inner:
 *     • Purple blur: top=28px, centered, 263×153px, #df9bff, blur(66.5px), opacity 0.3
 *     • H-lines: y=68 and y=184, 1px, white gradient, opacity 0.3
 *     • V-lines: x=48.47, 120.03, 162.38, 233.94; h=264px, 0.73px, opacity 0.8
 *   Ball: 96×96px circle, bg linear-gradient(180°,#239cff→#005be3)
 *     top-edge at 33px (= 50%–77.13px – translateY(–50%)), centered horizontally
 *     Icon: 54×54px centered inside ball
 *   Text: top=152px, left=24px, width=251px, gap 12px
 *     Title: Manrope Bold 32px (card4: 29px), tracking -0.05em, #111, lh 1
 *     Desc:  Sora 20px, tracking -0.05em, #555, lh 1.4
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
    icon: "/images/ciso/enterprise-icon-security.svg",
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
    icon: "/images/ciso/enterprise-icon-compliance.svg",
    title: "Enterprise Security Operations",
    desc: "Improve visibility into inherited software risk.",
    titleSize: 29,
  },
];

// ─── Desktop card ─────────────────────────────────────────────────────────────
function EnterpriseCard({ icon, title, desc, titleSize }: CardDef): React.ReactElement {
  return (
    <div className="relative flex-shrink-0" style={{ width: "295px", height: "324px" }}>
      {/* Outer cyan glow — 30% opacity border effect */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "40px", background: "#2cc1eb", opacity: 0.3 }}
      />
      {/* Inner white card: 287×316px */}
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

        {/* Vertical lines at exact Figma x positions */}
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

        {/* Blue gradient ball — top edge at 33px, centered */}
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: "50%",
            top: "33px",
            transform: "translateX(-50%)",
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

        {/* Text block: top=152px, left=24px, width=251px, gap 12px */}
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
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "20px",
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
      style={{ paddingTop: "120px", paddingBottom: "250px" }}
    >
      {/* ── Corner Union — top-right ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
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
        className="absolute pointer-events-none select-none hidden xl:block"
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
        className="absolute pointer-events-none select-none hidden xl:block"
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
        className="absolute pointer-events-none select-none hidden xl:block"
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

      <div
        className="relative mx-auto"
        style={{ maxWidth: "1276px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        {/* ── Heading ── */}
        <h2
          className="text-center mx-auto"
          style={{
            maxWidth: "654px",
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-t-display-2)",
            fontWeight: 700,
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
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

        {/* ════ DESKTOP — 4 cards in a flex row, 295×32 gap = 1276px ════ */}
        <div className="hidden xl:flex items-start" style={{ gap: "32px" }}>
          {CARDS.map((card) => (
            <EnterpriseCard key={card.title} {...card} />
          ))}
        </div>

        {/* ════ MOBILE — 2-column grid ════ */}
        <div className="xl:hidden grid grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white flex flex-col items-center text-center"
              style={{
                borderRadius: "20px",
                border: "1px solid rgba(44,193,235,0.35)",
                padding: "24px 16px 20px",
                gap: "12px",
              }}
            >
              {/* Scaled-down blue ball */}
              <div
                style={{
                  flexShrink: 0,
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                  boxShadow: "0px 4px 10px 0px rgba(28,60,142,0.33)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.icon}
                  alt=""
                  aria-hidden
                  style={{ width: "36px", height: "36px", objectFit: "contain" }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-t-heading-sm)",
                  fontWeight: 700,
                  letterSpacing: "var(--text-t-heading-sm-ls)",
                  lineHeight: "var(--text-t-heading-sm-lh)",
                  color: "#111",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-t-body-sm)",
                  fontWeight: 400,
                  letterSpacing: "var(--text-t-body-sm-ls)",
                  lineHeight: "var(--text-t-body-sm-lh)",
                  color: "#555",
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
