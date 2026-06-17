import { Reveal } from "@/components/ui/Reveal";

const CARDS = [
  {
    title: "Continuous Discovery",
    body: "Continuously discover software assets across environments.",
    iconSrc: "/images/cleansight/Ball1.webp",
  },
  {
    title: "Inherited Risk Analysis",
    body: "Correlate inherited software risk across environments.",
    iconSrc: "/images/cleansight/Ball2.webp",
  },
  {
    title: "Verified Inventories",
    body: "Maintain verified inventories, SBOMs, and provenance.",
    iconSrc: "/images/cleansight/Ball3.webp",
  },
  {
    title: "Verified Remediation",
    body: "Prioritize inherited risk with verified alternatives.",
    iconSrc: "/images/cleansight/Ball4.webp",
  },
];

export function CleanSightUnified(): React.ReactElement {
  return (
    <section
      data-section="CleanSightUnified"
      className="relative overflow-hidden bg-white"
    >
      {/* Decorative vector — top-left, partially off-screen. */}
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

      {/* Decorative union — bottom-right, rotated, partially off-screen. */}
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

      {/* Decorative ellipse glow — bottom-right. */}
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
        {/* Heading row. */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-[60px]">
          <Reveal header style={{ maxWidth: "654px", flexShrink: 0 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#111",
              }}
            >
              Continuous Visibility with{" "}
              <span className="cs-text-gradient-impact">Verified Remediation</span>
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20} style={{ maxWidth: "571px" }}>
            <p
              className="lg:pt-2"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                color: "#111",
                opacity: 0.8,
              }}
            >
              Correlate inherited software risk across environments and
              prioritize remediation with confidence.
            </p>
          </Reveal>
        </div>

        {/* Feature cards. */}
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
                /* Cyan glow border at 30% opacity. */
                boxShadow: "0 0 0 4px rgba(44, 193, 235, 0.30)",
                minHeight: "312px",
              }}
            >
              {/* Purple glow blob — top of card. */}
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

              {/* Decorative vertical gradient lines. */}
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

              {/* Decorative horizontal gradient lines. */}
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

              <div className="relative flex flex-col flex-1 z-10" style={{ padding: "24px", paddingTop: "36px", paddingBottom: "20px", gap: "12px" }}>
                {/* Per-card PNG sphere with embedded glyph. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.iconSrc}
                  alt=""
                  aria-hidden
                  width={112}
                  height={112}
                  loading="lazy"
                  decoding="async"
                  className="flex-shrink-0 pointer-events-none select-none"
                  style={{ width: "112px", height: "112px", objectFit: "contain" }}
                />

                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-h3)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    color: "#111",
                    /* Constrain width so every title wraps to two balanced
                       lines — keeps the four card titles visually consistent.
                       7.2em (~202px at --fs-h3) sits below the narrowest full
                       title (~243px) so the 2-word titles break, yet above the
                       widest wrapped line ("Risk Analysis", ~162px) so none
                       spill to a third line. em keeps it proportional to the
                       fluid font size. */
                    maxWidth: "7.2em",
                    textWrap: "balance",
                  }}
                >
                  {card.title}
                </h3>

                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
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
