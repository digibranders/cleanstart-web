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
        className="pointer-events-none select-none absolute hidden lg:block"
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
        className="pointer-events-none select-none absolute hidden lg:block"
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
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            <span className="block">When Container Visibility</span>
            <span className="block">
              Falls Short,{" "}
              <span className="cs-text-gradient-impact">Risk Grows</span>
            </span>
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "#111",
              opacity: 0.8,
            }}
          >
            And remediation falls even further behind
          </p>
        </div>

        {/* 2×2 Card Grid */}
        <div className="mt-12 lg:mt-[67px] grid grid-cols-1 sm:grid-cols-2 gap-px bg-[rgba(217,217,217,0.5)]">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.title}
              className="bg-white flex items-center gap-6 lg:gap-8 p-8 lg:p-10"
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
                    fontSize: "clamp(22px, 2.4vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    color: "#111",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(15px, 1.4vw, 20px)",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.4,
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
