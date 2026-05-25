type TrustCard = {
  title: string;
  body: string;
  iconSrc: string;
};

const TRUST_CARDS: TrustCard[] = [
  {
    title: "Trusted Source Components",
    body: "Build from verified upstream sources.",
    iconSrc: "/images/cleanstart-images/trust-ball-cube.svg",
  },
  {
    title: "Minimal Runtime Images",
    body: "Only required components included.",
    iconSrc: "/images/cleanstart-images/trust-ball-cube.svg",
  },
  {
    title: "Deterministic Builds",
    body: "Reproducible and verifiable pipelines.",
    iconSrc: "/images/cleanstart-images/trust-ball-refresh.svg",
  },
  {
    title: "Continuous Rebuilds",
    body: "Rapid response to newly disclosed vulnerabilities.",
    iconSrc: "/images/cleanstart-images/trust-ball-cube.svg",
  },
];

/* Vertical line x-positions from Figma (px within 287px card) */
const VERTICAL_LINES = [48.47, 120.03, 162.38, 233.94];

function TrustCardItem({ card }: { card: TrustCard }): React.ReactElement {
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
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-card-title-lg)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-body-lg)",
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
      style={{ minHeight: "clamp(600px, 52vw, 736px)" }}
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
        {/* Heading — Figma: 62px, bold, centered, gradient "Sources" */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-md)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111",
          }}
        >
          Built from Trusted{" "}
          <span className="cs-text-gradient-impact">Sources</span>
        </h2>

        {/* 4-card row — Figma: 287px cards, 41px gaps, centered */}
        <div
          className="mt-12 lg:mt-16 flex flex-col sm:flex-row flex-wrap lg:flex-nowrap justify-center"
          style={{ gap: "41px" }}
        >
          {TRUST_CARDS.map((card) => (
            <TrustCardItem key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
