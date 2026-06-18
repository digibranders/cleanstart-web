import { Reveal } from "@/components/ui/Reveal";

export function TeamsHowWeWork() {
  return (
    <section
      className="relative overflow-hidden bg-white"
      style={{ paddingBottom: "var(--spacing-section-cta)" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <Reveal header>
            <h2
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {"How We "}
              <span className="cs-text-gradient-impact">Work</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              className="max-w-[911px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                color: "rgba(17,17,17,0.65)",
              }}
            >
              We work the way we build, with clarity, trust, and continuous
              improvement at every step.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
