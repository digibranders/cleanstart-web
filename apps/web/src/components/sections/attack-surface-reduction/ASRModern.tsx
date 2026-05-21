const TARGETS: {
  title: string;
  desc: string;
  icon: React.ReactElement;
}[] = [
  {
    title: "Kubernetes Platforms",
    desc: "Production clusters running containerized workloads.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M14 3L25 9v10l-11 6L3 19V9L14 3z"
          stroke="white"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="3" fill="white" />
      </svg>
    ),
  },
  {
    title: "Regulated Environments",
    desc: "Workloads with compliance and audit requirements.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M14 4L6 8v8c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V8L14 4z"
          stroke="white"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M10 14l2.5 2.5L18 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Security-Focused Teams",
    desc: "Teams prioritizing prevention over remediation.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <circle cx="14" cy="10" r="4.5" stroke="white" strokeWidth="1.8" />
        <path
          d="M5 24c0-4.4 4-8 9-8s9 3.6 9 8"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function ASRModern(): React.ReactElement {
  return (
    <section
      data-section="ASRModern"
      className="relative overflow-hidden py-section-md"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)",
      }}
    >
      {/* Right bg decoration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        src="/images/vulnerability-remediation/s5-bg-decoration.png"
        alt=""
        width={372}
        height={260}
        style={{ right: 0, top: "60px", opacity: 0.3 }}
        loading="lazy"
        decoding="async"
      />
      {/* Left bg decoration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        src="/images/vulnerability-remediation/s5-bg-decoration.png"
        alt=""
        width={372}
        height={260}
        style={{ left: 0, bottom: "40px", opacity: 0.3 }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[1276px] px-4 sm:px-6">
        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-figtree)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            color: "white",
            maxWidth: "700px",
            marginBottom: "64px",
          }}
        >
          Built for Modern Production{" "}
          <span
            style={{
              background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Environments
          </span>
        </h2>

        {/* 3 target cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: "40px" }}>
          {TARGETS.map((t) => (
            <div key={t.title} className="flex flex-col" style={{ gap: "20px" }}>
              {/* Icon badge */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(154,81,255,0.25)",
                  border: "1.5px solid rgba(154,81,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.icon}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-figtree)",
                  fontSize: "clamp(16px, 1.67vw, 32px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.2,
                  color: "white",
                }}
              >
                {t.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-figtree)",
                  fontSize: "clamp(13px, 1.04vw, 20px)",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
