export function AsrBusinessDelivers(): React.ReactElement {
  const metrics: Array<{ title: string; description: string }> = [
    {
      title: "Reduce Security Risks",
      description: "Reduced exposure during image pull",
    },
    {
      title: "Smaller CVE Backlog",
      description: "Less recurring remediation across builds and releases",
    },
    {
      title: "Focused SBOMs",
      description: "Only meaningful components to track and defend",
    },
    {
      title: "Lower Operational Load",
      description: "Less scanning, patching, and rework for teams",
    },
  ];

  return (
    <section
      data-section="AsrBusinessDelivers"
      className="relative overflow-hidden"
      aria-label="What this delivers for your business"
    >
      <h2 className="sr-only">What this delivers for your business</h2>

      {/* Background photo */}
      <div
        className="relative"
        style={{ minHeight: "clamp(460px, 37vw, 711px)" }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/business-photo.jpg"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ objectFit: "cover", objectPosition: "center top" }}
          loading="lazy"
          decoding="async"
        />

        {/* Dark overlay — exact Figma stops (fill_RJ8WCA) with alpha so photo bleeds through */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(21,16,33,0.82) 0%, rgba(19,30,143,0.78) 71%, rgba(71,30,192,0.72) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative mx-auto max-w-[1276px] px-6 py-section-md flex flex-col justify-between h-full">
          {/* Heading */}
          <div>
            <p
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 3.23vw, 62px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.05,
                maxWidth: "519px",
              }}
            >
              What this delivers for{" "}
              <span
                style={{
                  background:
                    "linear-gradient(95.8deg, #9A51FF 1.76%, #2CC1EB 98.78%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                your business
              </span>
            </p>
          </div>

          {/* Metric columns */}
          <div
            className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
          >
            {metrics.map((metric, idx) => (
              <div
                key={metric.title}
                className="relative pt-7 pr-4 md:pr-0"
                style={
                  idx > 0
                    ? {
                        paddingLeft: "clamp(12px, 2.6vw, 32px)",
                        borderLeft: "1px solid rgba(255,255,255,0.18)",
                      }
                    : undefined
                }
              >
                <p
                  className="text-white"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(18px, 1.67vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.1,
                    marginBottom: "10px",
                  }}
                >
                  {metric.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 1.15vw, 22px)",
                    fontWeight: 400,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.3,
                    color: "#dddddd",
                  }}
                >
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
