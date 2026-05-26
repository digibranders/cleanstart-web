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

        {/* Card grid.
            Mobile: 1-col stack with 16px gap, each card is a standalone
            rounded-2xl card (icon centered on top, text centered below).
            sm+: original 2×2 grid with 1px gray dividers and flex-row cards
            (image left, text right). */}
        <div className="mt-12 lg:mt-[67px] grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-px sm:bg-[rgba(217,217,217,0.5)]">
          {PROBLEMS.map((p, i) => {
            // Per-cell dividers — sm+ only, drawn via right/bottom borders
            // that mesh with the grid's 1px gap + gray background.
            const showRight = i % 2 === 0;   // cells 0 and 2 → right edge of left column
            const showBottom = i < 2;        // cells 0 and 1 → bottom edge of top row
            return (
              <div
                key={p.title}
                className={[
                  "bg-white",
                  // Mobile: standalone column card, centered, with rounded border
                  "flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-[rgba(217,217,217,0.5)]",
                  // sm+: revert to original flex-row in-grid layout (no rounding/border, dividers via siblings)
                  "sm:flex-row sm:items-center sm:text-left sm:gap-6 sm:p-8 sm:rounded-none sm:border-0",
                  "lg:gap-8 lg:p-10",
                  // sm+ per-cell dividers
                  showRight && "sm:border-r sm:border-r-[rgba(217,217,217,0.5)]",
                  showBottom && "sm:border-b sm:border-b-[rgba(217,217,217,0.5)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Icon wrapper — 100×100 on mobile, 220×165 on sm+ */}
                <div className="relative flex-shrink-0 w-[100px] h-[100px] sm:w-[220px] sm:h-[165px]">
                  {/* Glow — fills the wrapper on mobile, original 165×165 offset on sm+ */}
                  <div
                    aria-hidden
                    className="pointer-events-none select-none absolute inset-0 sm:inset-auto sm:left-[16px] sm:top-0 sm:w-[165px] sm:h-[165px]"
                    style={{
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
                    sizes="(min-width: 640px) 220px, 100px"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
