const CARDS = [
  {
    title: "Continuous Discovery",
    body: "Continuously inventory container environments.",
    icon: "/images/cleansight/unified-icon-default.svg",
  },
  {
    title: "Risk Assessment",
    body: "Identify inherited vulnerabilities and runtime exposure.",
    icon: "/images/cleansight/unified-icon-default.svg",
  },
  {
    title: "Enterprise SBOM Generation",
    body: "Generate software inventories automatically.",
    icon: "/images/cleansight/unified-icon-sbom.svg",
  },
  {
    title: "Integrated Remediation",
    body: "Reduce remediation complexity and operational effort.",
    icon: "/images/cleansight/unified-icon-default.svg",
  },
];

export function CleanSightUnified(): React.ReactElement {
  return (
    <section
      data-section="CleanSightUnified"
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "792px" }}
    >
      {/* Decorative vector — top-left, partially off-screen */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        src="/images/cleansight/unified-vector-bg.svg"
        alt=""
        style={{ left: "171px", top: "-115px", width: "568px", height: "551px" }}
        loading="lazy"
        decoding="async"
      />

      {/* Decorative union — bottom-right, rotated, partially off-screen */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        src="/images/cleansight/unified-union-bg.svg"
        alt=""
        style={{
          left: "1617px",
          top: "537px",
          width: "488px",
          height: "497px",
          transform: "scaleY(-1) rotate(141.39deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Decorative ellipse glow — bottom-right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        src="/images/cleansight/unified-ellipse-glow.svg"
        alt=""
        style={{ left: "1732px", top: "656px", width: "315px", height: "315px" }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        {/* Heading row */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8 xl:gap-[60px]">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
              maxWidth: "654px",
              flexShrink: 0,
            }}
          >
            Unified Visibility and{" "}
            <span className="cs-text-gradient-impact">Remediation</span>
          </h2>

          <p
            className="xl:pt-2"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "#111",
              opacity: 0.8,
              maxWidth: "571px",
            }}
          >
            CleanSight continuously identifies, assesses, and recommends
            remediation actions to reduce container risk across environments.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-10 xl:mt-[72px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 xl:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="relative flex flex-col bg-white overflow-hidden"
              style={{
                borderRadius: "36px",
                /* Figma: cyan shadow layer (295×354) at 30% opacity behind 287×346 card */
                boxShadow: "0 0 0 4px rgba(44, 193, 235, 0.30)",
                minHeight: "346px",
              }}
            >
              {/* Purple glow blob — top of card */}
              <div
                aria-hidden
                className="pointer-events-none select-none absolute"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: "28px",
                  width: "263px",
                  height: "153px",
                  background: "#df9bff",
                  opacity: 0.30,
                  filter: "blur(66.5px)",
                  borderRadius: "50%",
                }}
              />

              {/* Decorative vertical gradient lines — percentages of the 287px Figma card */}
              {[16.9, 41.8, 56.6, 81.5].map((pct) => (
                <div
                  key={pct}
                  aria-hidden
                  className="pointer-events-none select-none absolute"
                  style={{
                    left: `${pct}%`,
                    top: 0,
                    width: "1px",
                    height: "76%",
                    background:
                      "linear-gradient(to bottom, transparent 0%, white 50.77%, transparent 100%)",
                    opacity: 0.8,
                  }}
                />
              ))}

              {/* Decorative horizontal gradient lines — percentages of the 264px Figma stripe area */}
              {[25.6, 69.5].map((pct) => (
                <div
                  key={pct}
                  aria-hidden
                  className="pointer-events-none select-none absolute"
                  style={{
                    left: 0,
                    top: `${pct}%`,
                    width: "100%",
                    height: "1px",
                    background:
                      "linear-gradient(to right, transparent 0%, white 50.77%, transparent 100%)",
                    opacity: 0.30,
                  }}
                />
              ))}

              {/* Card content */}
              <div className="relative flex flex-col flex-1 z-10" style={{ padding: "24px", paddingTop: "54px", gap: "12px" }}>
                {/* Blue ball icon */}
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "50%",
                    background: "linear-gradient(to bottom, #239CFF 0%, #005BE3 100%)",
                    boxShadow: "0px 6.171px 14.537px 0px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.icon}
                    alt=""
                    aria-hidden
                    style={{ width: "54px", height: "54px", objectFit: "contain" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(22px, 2.4vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    color: "#111",
                  }}
                >
                  {card.title}
                </h3>

                {/* Body */}
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(15px, 1.4vw, 20px)",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.4,
                    color: "#555",
                  }}
                >
                  {card.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
