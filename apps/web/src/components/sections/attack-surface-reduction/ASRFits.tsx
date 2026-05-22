import Image from "next/image";

const INTEGRATIONS: { title: string; desc: string; icon: string; iconAlt: string }[] = [
  {
    title: "Drop-in Images",
    desc: "Works with existing workflows.",
    icon: "/images/attack-surface-reduction/icon-monitor.png",
    iconAlt: "Monitor icon",
  },
  {
    title: "Pipeline Compatible",
    desc: "Integrates into CI/CD environments.",
    icon: "/images/attack-surface-reduction/icon-ring.png",
    iconAlt: "Pipeline icon",
  },
  {
    title: "Deploy Anywhere",
    desc: "Cloud, on-prem, or regulated environments.",
    icon: "/images/attack-surface-reduction/icon-gear.png",
    iconAlt: "Deploy icon",
  },
];

export function ASRFits(): React.ReactElement {
  return (
    <section
      data-section="ASRFits"
      className="bg-white py-section-md"
    >
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading row: heading left, subtitle right */}
        <div
          className="flex flex-col xl:flex-row xl:items-end xl:justify-between"
          style={{ marginBottom: "64px", gap: "32px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-figtree)",
              fontSize: "var(--text-t-display-2)",
              fontWeight: 700,
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              color: "#111111",
              maxWidth: "560px",
            }}
          >
            Fits into what you've{" "}
            <span
              style={{
                background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              already built
            </span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-figtree)",
              fontSize: "clamp(15px, 1.56vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "#555555",
              maxWidth: "480px",
            }}
          >
            Stay informed with the latest research, threat intelligence reports, and expert
            analysis from our security team.
          </p>
        </div>

        {/* 3 integration cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: "24px" }}>
          {INTEGRATIONS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col"
              style={{
                background: "linear-gradient(135deg, #F3F0FF 0%, #EEF4FF 100%)",
                borderRadius: "20px",
                padding: "40px 32px",
                gap: "20px",
                border: "1px solid rgba(154,81,255,0.12)",
              }}
            >
              <Image src={item.icon} alt={item.iconAlt} width={80} height={80} sizes="80px" />
              <h3
                style={{
                  fontFamily: "var(--font-figtree)",
                  fontSize: "var(--text-t-heading-lg)",
                  fontWeight: 700,
                  letterSpacing: "var(--text-t-heading-lg-ls)",
                  lineHeight: "var(--text-t-heading-lg-lh)",
                  color: "#111111",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-figtree)",
                  fontSize: "var(--text-t-heading-sm)",
                  fontWeight: 400,
                  letterSpacing: "var(--text-t-heading-sm-ls)",
                  lineHeight: "var(--text-t-heading-sm-lh)",
                  color: "#555555",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
