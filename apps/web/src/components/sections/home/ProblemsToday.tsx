import { Reveal } from "@/components/ui/Reveal";

type Problem = { n: string; title: string; desc: string };

const PROBLEMS: Problem[] = [
  {
    n: "01",
    title: "Reactive CVE Operations",
    desc: "Security teams spend cycles prioritizing vulnerabilities without verified remediation paths.",
  },
  {
    n: "02",
    title: "Inherited Software Risk",
    desc: "Modern applications inherit vulnerabilities, malicious packages, and unknown dependencies across the software lifecycle.",
  },
  {
    n: "03",
    title: "Continuous Compliance Pressure",
    desc: "Regulated environments demand verifiable software, continuous evidence, and trusted delivery across every release.",
  },
];

const cardTitleStyle = {
  fontSize: "var(--fs-h3)",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
} as const;

const descStyle = {
  fontFamily: "var(--font-sora), Sora, sans-serif",
  fontSize: "var(--fs-body)",
  lineHeight: 1.45,
  letterSpacing: "-0.01em",
} as const;

function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-[28px] border border-black/[0.06] bg-white p-7 sm:p-8">
      {/* Faint purple corner bloom (Figma Union). */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-40 w-40"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(154,81,255,0.07), transparent 65%)",
        }}
      />
      <span
        aria-hidden
        className="absolute right-7 top-4 font-sans text-[rgba(102,102,102,0.35)] sm:right-8"
        style={{ fontSize: "var(--fs-h3)", letterSpacing: "-0.04em" }}
      >
        {problem.n}
      </span>
      <h3
        className="relative max-w-[80%] font-display font-bold text-[#111]"
        style={cardTitleStyle}
      >
        {problem.title}
      </h3>
      <p className="relative mt-3 text-[#333]" style={descStyle}>
        {problem.desc}
      </p>
    </div>
  );
}

export function ProblemsToday() {
  return (
    <section className="relative overflow-hidden bg-[#f6f6f6] py-section-lg">
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading */}
        <Reveal header>
          <h2
            className="mx-auto max-w-[720px] text-center font-display font-bold text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Built for the Problems Teams Fix{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)",
              }}
            >
              Today
            </span>
          </h2>
        </Reveal>

        {/* Left feature card + right column of numbered problems */}
        <Reveal>
          <div className="mt-12 flex flex-col items-stretch gap-6 lg:flex-row lg:gap-8">
            {/* Left: AI-Generated Software Risk + illustration */}
            <div className="relative flex min-h-[440px] flex-col overflow-hidden rounded-[32px] border border-black/[0.06] bg-white lg:min-h-0 lg:w-[40%]">
              <div className="relative z-10 p-7 sm:p-8">
                <h3
                  className="font-display font-bold text-[#111]"
                  style={{
                    fontSize: "var(--fs-h2)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  AI-Generated Software Risk
                </h3>
                <p className="mt-5 max-w-[420px] text-[#333]" style={descStyle}>
                  AI-assisted development accelerates software delivery but
                  introduces unverified dependencies, unknown provenance, and
                  inherited software risk at machine scale.
                </p>
              </div>
              {/* Cube + arcs illustration (exported from Figma). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/problems/ai-risk-illustration.png"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="pointer-events-none mt-auto w-full select-none"
              />
            </div>

            {/* Right: 3 numbered problem cards */}
            <div className="flex flex-1 flex-col gap-6 lg:gap-8">
              {PROBLEMS.map((p) => (
                <ProblemCard key={p.n} problem={p} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
