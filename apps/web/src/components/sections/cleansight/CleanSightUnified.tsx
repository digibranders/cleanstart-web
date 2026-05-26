/* Per-card white-line inline SVG icons. Mirrors the per-chip-icon pattern in
 * SCATransform — keeps visual weight consistent across the row and avoids
 * shipping 4 separate SVG asset files for a single use site. */
function IconDiscovery(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Magnifying glass — circle + diagonal handle */}
      <circle cx="14" cy="14" r="7.5" stroke="#fff" strokeWidth="1.8"/>
      <path d="M19.5 19.5l5 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
      {/* Bulb inside the lens — top dome + filament base */}
      <path d="M14 9.5a3 3 0 0 0-2 5.2v1.3h4v-1.3a3 3 0 0 0-2-5.2z" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M13 16.5h2M13.3 17.5h1.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconClipboardCheck(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Clipboard body */}
      <rect x="7" y="6.5" width="18" height="21" rx="2.4" stroke="#fff" strokeWidth="1.8"/>
      {/* Clip at top */}
      <rect x="12" y="3.5" width="8" height="5" rx="1.2" stroke="#fff" strokeWidth="1.8" fill="#fff"/>
      {/* Big checkmark in the body */}
      <path d="M11 16.5l3.2 3.2 6.2-6.4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Two short underlines for "list items" effect */}
      <path d="M11 22h10" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}
function IconEnterprise(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Building outline — stepped pyramid skyscraper */}
      <path d="M6 28V13l5-3 5 3v15M16 28V8l5-2.5 5 2.5v20" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* Windows — left tower */}
      <path d="M9 16h1M12 16h1M9 19h1M12 19h1M9 22h1M12 22h1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Windows — right tower */}
      <path d="M19 12h1M22 12h1M19 15h1M22 15h1M19 18h1M22 18h1M19 21h1M22 21h1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Ground line */}
      <path d="M4 28h24" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function IconNetwork(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Connecting lines between the 4 nodes (drawn first so dots sit on top) */}
      <path d="M16 10v5M16 17l-6 5M16 17l6 5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
      {/* Top center node (slightly larger — the "hub") */}
      <circle cx="16" cy="16" r="3" fill="#fff"/>
      {/* Top node */}
      <circle cx="16" cy="7" r="2.8" fill="#fff"/>
      {/* Bottom-left node */}
      <circle cx="8" cy="24" r="2.8" fill="#fff"/>
      {/* Bottom-right node */}
      <circle cx="24" cy="24" r="2.8" fill="#fff"/>
    </svg>
  );
}

const CARDS = [
  {
    title: "Continuous Discovery",
    body: "Continuously inventory container environments.",
    Icon: IconDiscovery,
  },
  {
    title: "Risk Assessment",
    body: "Identify inherited vulnerabilities and runtime exposure.",
    Icon: IconClipboardCheck,
  },
  {
    title: "Enterprise SBOM Generation",
    body: "Generate software inventories automatically.",
    Icon: IconEnterprise,
  },
  {
    title: "Integrated Remediation",
    body: "Reduce remediation complexity and operational effort.",
    Icon: IconNetwork,
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
        className="pointer-events-none select-none absolute hidden lg:block"
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
        className="pointer-events-none select-none absolute hidden lg:block"
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
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/unified-ellipse-glow.svg"
        alt=""
        style={{ left: "1732px", top: "656px", width: "315px", height: "315px" }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        {/* Heading row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-[60px]">
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
            className="lg:pt-2"
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
        <div className="mt-10 lg:mt-[72px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.title}
              /* `max-sm:!min-h-0` drops the 346px floor on mobile (1-col)
                 where content-hug is wanted; sm+ keeps the floor so the
                 2-col / 4-col grid rows stay aligned. */
              className="relative flex flex-col bg-white overflow-hidden max-sm:!min-h-0"
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
                  <card.Icon />
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
