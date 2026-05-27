interface Sector {
  title: string;
  description: string;
}

const SECTORS: Sector[] = [
  {
    title: "Government & Public Sector",
    description: "Built for regulated federal workloads.",
  },
  {
    title: "Financial Services",
    description: "Validated cryptography for sensitive environments.",
  },
  {
    title: "Healthcare & Life Sciences",
    description: "Secure compliant infrastructure for critical systems.",
  },
  {
    title: "Enterprise Security Teams",
    description: "Reduce operational compliance complexity.",
  },
];

export function FipsRegulatedEnvironments(): React.ReactElement {
  return (
    <section
      data-section="FipsRegulatedEnvironments"
      className="relative overflow-hidden"
      aria-label="Built for Regulated Environments"
      /*
       * Mobile (Figma 366:8028): section frame h=695px.
       * Desktop: scales up proportionally via vw.
       */
      style={{ minHeight: "clamp(695px, 50vw, 800px)" }}
    >
      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/regulated-photo.png"
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ objectFit: "cover", objectPosition: "center center" }}
        loading="lazy"
        decoding="async"
      />

      {/*
       * Mobile overlay — transparent at top, fades to black at ~79%.
       * Figma 366:8028: linear-gradient(180deg, rgba(0,0,0,0) 24%, rgba(0,0,0,0.9) 79%)
       * This lets the photo show through at top while darkening the sector list area.
       */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 24%, rgba(0,0,0,0.9) 79%)",
        }}
      />

      {/*
       * Mobile purple overlay — rises from bottom.
       * Figma 366:8028 node 366:8030: rotated gradient giving a purple
       * wash in the lower section behind the sector list.
       */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(0deg, rgba(71,30,192,0.60) 0%, rgba(66,30,188,0.30) 20%, rgba(66,30,188,0) 42%)",
        }}
      />

      {/*
       * Desktop gradient overlay — left-to-right for legibility with
       * right-positioned photo subject.
       */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,12,40,0.92) 0%, rgba(15,12,40,0.86) 45%, rgba(15,12,40,0.55) 75%, rgba(15,12,40,0.30) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-10 pt-8 pb-14 md:py-[110px] flex flex-col" style={{ minHeight: "inherit" }}>
        {/*
         * Heading
         * Mobile (Figma 366:8028): 28px Bold, centered, ls=-0.05em, lh=1.2, w=264px.
         * Desktop: 56px, left-aligned, maxWidth=770px.
         */}
        <h2
          className="text-white text-center md:text-left mb-16 md:mb-[64px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.1,
            maxWidth: "770px",
          }}
        >
          Built for Regulated{" "}
          <span className="cs-text-gradient-impact">Environments</span>
        </h2>

        {/*
         * Mobile layout — flex column with gradient dividers.
         * Figma 366:8028: flex-col gap=24px, sectors at left=32px.
         * Sectors: title 20px SemiBold, desc 14px Regular, separated by
         * a 147px × 1px gradient line fading left-to-right.
         */}
        <div className="flex flex-col gap-[24px] md:hidden px-4 mt-auto">
          {SECTORS.map((sector, idx) => (
            <div key={sector.title}>
              <div className="flex flex-col gap-[6px]">
                <p
                  className="text-white"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-h4)",
                    fontWeight: 600,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                  }}
                >
                  {sector.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.80)",
                  }}
                >
                  {sector.description}
                </p>
              </div>

              {/*
               * Gradient divider — between sectors, not after the last.
               * Figma 366:8028: Rectangle19 = 1px × 147px image rotated -90°
               * giving a horizontal line that fades right. Reproduced in CSS.
               */}
              {idx < SECTORS.length - 1 && (
                <div
                  aria-hidden
                  className="mt-[24px]"
                  style={{
                    height: "1px",
                    width: "147px",
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/*
         * Desktop layout — 4-column grid with left-border dividers.
         * Figma desktop node (node 366:7788 / 787:xxxx).
         */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-0 mt-auto md:pt-16">
          {SECTORS.map((sector, idx) => (
            <div
              key={sector.title}
              className={`relative md:px-7 md:first:pl-0 ${idx > 0 ? "md:border-l md:border-white/20" : ""}`}
            >
              <p
                className="text-white mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h3)",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.1,
                  maxWidth: "219px",
                }}
              >
                {sector.title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-body)",
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.78)",
                  maxWidth: "219px",
                }}
              >
                {sector.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
