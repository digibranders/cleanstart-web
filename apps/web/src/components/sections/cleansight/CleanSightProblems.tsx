import Image from "next/image";

const PROBLEMS = [
  {
    title: "Shadow Containers",
    body: "Untracked workloads increase exposure.",
    img: "/images/cleansight/problem-shadow-containers.png",
    alt: "Shadow container illustration",
  },
  {
    title: "Fragmented Views",
    body: "Disconnected tools create operational gaps.",
    img: "/images/cleansight/problem-fragmented-views.png",
    alt: "Fragmented views illustration",
  },
  {
    title: "Unknown Image Contents",
    body: "Inherited dependencies hide risk.",
    img: "/images/cleansight/problem-unknown-image.png",
    alt: "Unknown image contents illustration",
  },
  {
    title: "Audit Complexity",
    body: "Incomplete visibility slows compliance efforts.",
    img: "/images/cleansight/problem-audit-complexity.png",
    alt: "Audit complexity illustration",
  },
];

export function CleanSightProblems(): React.ReactElement {
  return (
    <section
      data-section="CleanSightProblems"
      className="relative overflow-hidden bg-white"
    >
      {/* Decorative union blobs */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "-310px",
          top: "-267px",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "rgba(154, 81, 255, 0.04)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-310px",
          top: "254px",
          width: "590px",
          height: "590px",
          borderRadius: "50%",
          background: "rgba(44, 193, 235, 0.04)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        {/* Heading */}
        <div className="text-center">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-display-2)",
              fontWeight: 700,
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              color: "#111",
            }}
          >
            When Container Visibility Falls Short,{" "}
            <span
              style={{
                background: "linear-gradient(103deg, #9A51FF 2%, #2CC1EB 99%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Risk Grows
            </span>
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.5625vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "#111",
              opacity: 0.8,
            }}
          >
            And remediation falls even further behind
          </p>
        </div>

        {/* 2×2 Card Grid */}
        <div className="mt-12 xl:mt-[67px] grid grid-cols-1 sm:grid-cols-2 gap-px bg-[rgba(217,217,217,0.5)]">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.title}
              className="bg-white flex items-center gap-6 xl:gap-8 p-8 xl:p-10"
              style={{
                borderRight: i % 2 === 0 ? "1px solid rgba(217,217,217,0.5)" : undefined,
                borderBottom: i < 2 ? "1px solid rgba(217,217,217,0.5)" : undefined,
              }}
            >
              {/* Glow + image */}
              <div className="relative flex-shrink-0" style={{ width: "220px", height: "165px" }}>
                <div
                  aria-hidden
                  className="pointer-events-none select-none absolute"
                  style={{
                    left: "16px",
                    top: "0px",
                    width: "165px",
                    height: "165px",
                    borderRadius: "50%",
                    background: "rgba(154, 81, 255, 0.18)",
                    filter: "blur(30px)",
                  }}
                />
                <Image
                  src={p.img}
                  alt={p.alt}
                  width={220}
                  height={165}
                  sizes="220px"
                  className="relative object-contain w-full h-full"
                  loading="lazy"
                />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-[10px]">
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-t-heading-lg)",
                    fontWeight: 700,
                    letterSpacing: "var(--text-t-heading-lg-ls)",
                    lineHeight: "var(--text-t-heading-lg-lh)",
                    color: "#111",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-t-heading-md)",
                    fontWeight: 400,
                    letterSpacing: "var(--text-t-heading-md-ls)",
                    lineHeight: "var(--text-t-heading-md-lh)",
                    color: "#333",
                  }}
                >
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
