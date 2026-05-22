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
      style={{ minHeight: "clamp(400px, 30vw, 550px)" }}
    >
      {/* Background photo (Figma 1:586 — bare 1922×669 image, no text overlay) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/regulated-photo.png"
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ objectFit: "cover", objectPosition: "right center" }}
        loading="lazy"
        decoding="async"
      />

      {/* Left-side dark gradient overlay for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,12,40,0.92) 0%, rgba(15,12,40,0.86) 45%, rgba(15,12,40,0.55) 75%, rgba(15,12,40,0.30) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-14 md:py-[110px]">
        <h2
          className="text-white mb-10 md:mb-[64px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-t-display-2)",
            fontWeight: 600,
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
            maxWidth: "770px",
          }}
        >
          Built for Regulated{" "}
          <span
            style={{
              background:
                "linear-gradient(95deg, #239CFF 0%, #82AEFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Environments
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-0">
          {SECTORS.map((sector, idx) => (
            <div
              key={sector.title}
              className="relative md:px-7 first:md:pl-0"
              style={
                idx > 0
                  ? {
                      borderLeft:
                        "1px solid rgba(255,255,255,0.20)",
                    }
                  : undefined
              }
            >
              <p
                className="text-white mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-t-heading-lg)",
                  fontWeight: 700,
                  letterSpacing: "var(--text-t-heading-lg-ls)",
                  lineHeight: "var(--text-t-heading-lg-lh)",
                  maxWidth: "219px",
                }}
              >
                {sector.title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-t-body-lg)",
                  fontWeight: 400,
                  letterSpacing: "var(--text-t-body-lg-ls)",
                  lineHeight: "var(--text-t-body-lg-lh)",
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
