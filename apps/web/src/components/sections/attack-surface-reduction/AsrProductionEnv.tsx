export function AsrProductionEnv(): React.ReactElement {
  const items: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      icon: "/images/attack-surface-reduction/prod-icon-k8s.png",
      title: "Kubernetes Platforms",
      description:
        "Production clusters running containerized workloads.",
    },
    {
      icon: "/images/attack-surface-reduction/prod-icon-docs.png",
      title: "Regulated Environments",
      description:
        "Workloads with compliance and audit requirements.",
    },
    {
      icon: "/images/attack-surface-reduction/prod-icon-security.png",
      title: "Security-Focused Teams",
      description:
        "Teams prioritizing prevention over remediation.",
    },
  ];

  return (
    <section
      data-section="AsrProductionEnv"
      className="relative overflow-hidden"
      aria-label="Built for Modern Production Environments"
      style={{
        background:
          "linear-gradient(180deg, rgba(21,16,33,1) 0%, rgba(19,30,143,1) 67%, rgba(71,30,192,1) 100%)",
        minHeight: "clamp(360px, 32vw, 620px)",
      }}
    >
      <h2 className="sr-only">Built for Modern Production Environments</h2>

      {/* Decorative mesh — top-left */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        className="absolute pointer-events-none select-none mix-blend-overlay hidden md:block"
        style={{
          left: "-147px",
          top: "397px",
          width: "469px",
          height: "488px",
          transform: "rotate(-150deg) scaleY(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Decorative mesh — top-right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        className="absolute pointer-events-none select-none mix-blend-overlay hidden md:block"
        style={{
          right: "-150px",
          top: "-175px",
          width: "488px",
          height: "497px",
          transform: "rotate(141.39deg) scaleY(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Content */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 pt-section-md pb-section-cta">
        {/* Heading */}
        <p
          className="text-white mb-14 md:mb-[88px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            maxWidth: "686px",
          }}
        >
          Built for Modern Production{" "}
          <span
            style={{
              background:
                "linear-gradient(101.4deg, #9A51FF 45.6%, #2CC1EB 93.65%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Environments
          </span>
        </p>

        {/* Items row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0">
          {items.map((item, idx) => (
            <div
              key={item.title}
              className="relative flex flex-col gap-0"
              style={
                idx > 0
                  ? {
                      paddingLeft: "clamp(16px, 2.6vw, 48px)",
                      borderLeft:
                        "1px dashed rgba(255,255,255,0.22)",
                    }
                  : undefined
              }
            >
              {/* Blue gradient icon ball */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                aria-hidden
                className="pointer-events-none select-none mb-6"
                style={{ width: "72px", height: "72px" }}
                loading="lazy"
                decoding="async"
              />

              {/* Title */}
              <p
                className="text-white mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(20px, 1.67vw, 32px)",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.0,
                  maxWidth: "340px",
                }}
              >
                {item.title}
              </p>

              {/* Description */}
              <p
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(14px, 1.04vw, 20px)",
                  fontWeight: 400,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.4,
                  maxWidth: "294px",
                  opacity: 0.85,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
