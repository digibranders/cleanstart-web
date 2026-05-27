import type React from "react";

type TrustCard = {
  title: string;
  body: string;
  iconSrc: string;
};

const TRUST_CARDS: TrustCard[] = [
  {
    title: "Trusted Source Components",
    body: "Build from verified upstream sources.",
    iconSrc: "/images/cleanstart-images/trust-icon-trusted-source.svg",
  },
  {
    title: "Minimal Runtime Images",
    body: "Only required components included.",
    iconSrc: "/images/cleanstart-images/trust-icon-minimal-runtime.svg",
  },
  {
    title: "Deterministic Builds",
    body: "Reproducible and verifiable pipelines.",
    iconSrc: "/images/cleanstart-images/trust-icon-deterministic.svg",
  },
  {
    title: "Continuous Rebuilds",
    body: "Rapid response to newly disclosed vulnerabilities.",
    iconSrc: "/images/cleanstart-images/trust-icon-continuous-rebuild.svg",
  },
];

/* Vertical line x-positions from Figma (px within 287px card) */
const VERTICAL_LINES = [48.47, 120.03, 162.38, 233.94];

/**
 * Mobile card — vertical layout matching Figma 856:549
 * 328×226 px, rounded-16, icon centered at top, text centered below
 */
function MobileTrustCard({ card }: { card: TrustCard }): React.ReactElement {
  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: "328px",
        height: "226px",
        position: "relative",
        borderRadius: "16px",
        background: "white",
        overflow: "hidden",
        /* Subtle cyan glow border — simulates Figma rect1000001781 asset */
        boxShadow:
          "0 0 0 1.5px rgba(44,193,235,0.22), 0 6px 24px rgba(44,193,235,0.14), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Purple glow blob — 209×90 px, blur 66.5 px, opacity 50 % — sits behind ball */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          top: "-16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "209px",
          height: "90px",
          background: "#df9bff",
          filter: "blur(66.5px)",
          opacity: 0.5,
          borderRadius: "50%",
        }}
      />

      {/* Blue ball — 70×70 px, centered horizontally, top 10 px */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
          boxShadow:
            "0px 4.5px 10.5px rgba(28,60,142,0.33), inset 0px 0.116px 0.582px rgba(255,255,255,0.81), inset 0px -0.233px 0.291px rgba(0,44,179,0.5)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.iconSrc}
          alt=""
          aria-hidden
          width={40}
          height={40}
          className="select-none pointer-events-none"
          style={{ width: "40px", height: "40px" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text block — centered, top 108 px, gap 12 px */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{
          top: "108px",
          left: "16px",
          right: "16px",
          gap: "12px",
        }}
      >
        <h3
          className="font-display"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
            color: "#000",
          }}
        >
          {card.title}
        </h3>
        <p
          className="font-sans"
          style={{
            fontSize: "var(--fs-body-sm)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.5,
            color: "rgba(17,17,17,0.8)",
          }}
        >
          {card.body}
        </p>
      </div>
    </div>
  );
}

/**
 * Desktop card — Figma: 295×354 outer, 287×346 inner
 * Cyan glow border wrapper, white card, grid lines, left-aligned ball + text
 */
function DesktopTrustCard({ card }: { card: TrustCard }): React.ReactElement {
  return (
    /* Outer cyan glow wrapper — Figma: 295×354, rounded-40, rgba(44,193,235,0.3) */
    <div
      className="shrink-0"
      style={{
        background: "rgba(44,193,235,0.3)",
        borderRadius: "40px",
        padding: "4px",
      }}
    >
      {/* Inner white card — Figma: 287×346, rounded-36, overflow-clip */}
      <div
        className="relative bg-white overflow-hidden"
        style={{
          width: "287px",
          minHeight: "346px",
          borderRadius: "36px",
        }}
      >
        {/* Purple glow blob — Figma: #df9bff, blur 66.5px, opacity 30%, w-262px, h-153px, top-28px, centered */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "262.871px",
            height: "153px",
            background: "#df9bff",
            filter: "blur(66.5px)",
            opacity: 0.3,
            borderRadius: "50%",
          }}
        />

        {/* Horizontal gradient lines — Figma: top 67.54px and 183.54px, opacity 30% */}
        {[67.54, 183.54].map((y) => (
          <div
            key={y}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: `${y}px`,
              left: "-68px",
              right: "-68px",
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50.77%, rgba(255,255,255,0) 100%)",
              opacity: 0.3,
            }}
          />
        ))}

        {/* Vertical gradient lines — Figma: 4 lines, h-264px, w-0.73px, opacity 80% */}
        {VERTICAL_LINES.map((x) => (
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
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50.77%, rgba(255,255,255,0) 100%)",
              opacity: 0.8,
            }}
          />
        ))}

        {/* Blue ball icon — Figma: 96×96px, top 24px, left 24px (left-aligned with text) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: "24px",
            left: "24px",
            width: "96px",
            height: "96px",
            borderRadius: "160px",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 6.171px 14.537px rgba(28,60,142,0.33), inset 0px 0.116px 0.582px rgba(255,255,255,0.81), inset 0px -0.233px 0.291px rgba(0,44,179,0.5)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.iconSrc}
            alt=""
            aria-hidden
            width={54}
            height={54}
            className="select-none pointer-events-none"
            style={{ width: "54px", height: "54px" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text — Figma: left 24px, top 162px, width 251px, gap 12px */}
        <div
          className="absolute flex flex-col"
          style={{ left: "24px", top: "162px", width: "251px", gap: "12px" }}
        >
          <h3
            className="font-display"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {card.title}
          </h3>
          <p
            className="font-sans"
            style={{
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.03em",
              color: "#555",
            }}
          >
            {card.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CleanStartImagesBrowse(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesTrustedSources"
      className="relative overflow-hidden bg-white"
    >
      {/* Corner vector — top-left (Figma: left-[-414px], top-[-174px], 568×551) */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-414px", top: "-174px", width: "568px", height: "551px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/browse-vector-corner.svg"
          alt=""
          aria-hidden
          className="block size-full max-w-none select-none pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Corner vector — top-right (Figma: left-[1260px], top-[-156px], 568×551) */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "1260px", top: "-156px", width: "568px", height: "551px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/browse-vector-corner.svg"
          alt=""
          aria-hidden
          className="block size-full max-w-none select-none pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Ellipse glow — left (Figma: left-[-305px], top-578, size-315, inset-[-64.44%]) */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-305px", top: "578px", width: "315px", height: "315px" }}
      >
        <div style={{ position: "absolute", inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/browse-ellipse-glow.svg"
            alt=""
            aria-hidden
            className="block size-full max-w-none select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Ellipse glow — right (Figma: left-[1487px], top-578, size-315, inset-[-64.44%]) */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "1487px", top: "578px", width: "315px", height: "315px" }}
      >
        <div style={{ position: "absolute", inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/browse-ellipse-glow.svg"
            alt=""
            aria-hidden
            className="block size-full max-w-none select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center"
        style={{
          paddingTop: "var(--spacing-section-md)",
          paddingBottom: "var(--spacing-section-md)",
        }}
      >
        {/* Heading — desktop: --text-display-md (~62px); mobile: ~28px via token clamp */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h1)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
            color: "#111",
          }}
        >
          Built from Trusted{" "}
          <span className="cs-text-gradient-impact">Sources</span>
        </h2>

        {/* ── Mobile card list — vertical stacked, hidden at lg+ ────────────── */}
        <div className="lg:hidden mt-10 w-full flex flex-col items-center gap-7">
          {TRUST_CARDS.map((card) => (
            <MobileTrustCard key={card.title} card={card} />
          ))}
        </div>

        {/* ── Desktop card row — 4-up horizontal, hidden below lg ──────────── */}
        <div
          className="hidden lg:flex flex-row flex-nowrap justify-center mt-16"
          style={{ gap: "41px" }}
        >
          {TRUST_CARDS.map((card) => (
            <DesktopTrustCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
