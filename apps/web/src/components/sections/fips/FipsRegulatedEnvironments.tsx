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
       * Mobile (Figma 366:7788): 695px tall for stacked 4-item list.
       * Desktop: clamp up to 550px for 4-column layout.
       */
      style={{ minHeight: "clamp(520px, 48vw, 550px)" }}
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
       * Mobile gradient overlay — top-to-bottom dark (Figma 366:7788 shows
       * heavy dark overlay covering the whole mobile section).
       */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,8,32,0.92) 0%, rgba(10,8,32,0.88) 60%, rgba(10,8,32,0.80) 100%)",
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-10 py-14 md:py-[110px]">
        {/*
         * Heading
         * Mobile: 28px Figtree Bold (Figma 366:7788), desktop: 56px
         */}
        <h2
          className="text-white mb-8 md:mb-[64px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 56px)",
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
         * Grid:
         *   Mobile  (< md): 1 column, items stacked vertically — matches Figma 366:7788
         *   Desktop (≥ md): 4 columns side-by-side with left-border dividers
         */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 md:gap-0">
          {SECTORS.map((sector, idx) => (
            <div
              key={sector.title}
              /*
               * Border-left divider only on md+ (4-column layout).
               * On mobile (1-column) no divider is shown.
               */
              className={`relative md:px-7 md:first:pl-0 ${idx > 0 ? "md:border-l md:border-white/20" : ""}`}
            >
              {/*
               * Sector title
               * Mobile: 20px SemiBold (Figma 366:7788), desktop: 32px
               */}
              <p
                className="text-white mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(20px, 2.4vw, 32px)",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.1,
                  maxWidth: "219px",
                }}
              >
                {sector.title}
              </p>
              {/*
               * Sector description
               * Mobile: 14px Regular (Figma 366:7788), desktop: 20px
               */}
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(14px, 1.4vw, 20px)",
                  fontWeight: 400,
                  letterSpacing: "-0.035em",
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
