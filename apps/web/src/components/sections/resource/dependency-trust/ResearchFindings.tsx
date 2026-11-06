import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";

import { FINDINGS, type Run } from "./content";
import { GradientTitle, HAIRLINE_CARD, LightSection, STAT_GRADIENT } from "./parts";

const runText = (run: Run): string => (typeof run === "string" ? run : run.strong);

export function ResearchFindings(): React.ReactElement {
  return (
    <LightSection dataSection="ResearchFindings">
      <Reveal header>
        <GradientTitle text={FINDINGS.heading} accent="reveals" />
      </Reveal>

      <div className="mx-auto mt-10 flex max-w-[1120px] flex-col gap-5 lg:mt-14 lg:gap-6">
        {FINDINGS.items.map((finding, index) => (
          <Reveal key={finding.id} y={24}>
            <article
              id={finding.id}
              className="relative overflow-hidden"
              style={{ ...HAIRLINE_CARD, padding: "clamp(24px, 3vw, 44px)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute opacity-70"
                style={{
                  [index % 2 ? "left" : "right"]: "-60px",
                  bottom: "-60px",
                  width: "262px",
                  height: "262px",
                  background:
                    "radial-gradient(50% 50% at 50% 50%, rgba(223, 155, 255, 0.28) 0%, rgba(223, 155, 255, 0) 70%)",
                }}
              />
              <div
                className={`relative flex flex-col gap-6 lg:items-center lg:gap-12 ${
                  index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                <div className="relative mx-auto flex h-[120px] w-[120px] shrink-0 items-center justify-center lg:mx-0">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(169, 116, 255, 0.22) 0%, rgba(44, 193, 235, 0.08) 70%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                  <Image
                    src={finding.icon}
                    alt=""
                    aria-hidden
                    width={360}
                    height={360}
                    sizes="120px"
                    className="relative h-[120px] w-[120px] object-contain"
                  />
                </div>
                <div className="max-w-[64ch]">
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h3)",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.15,
                      color: "#1a1a1a",
                      textWrap: "balance",
                    }}
                  >
                    <span style={STAT_GRADIENT}>{finding.number}</span> {finding.title}
                  </h3>
                  <div className="mt-4 flex flex-col gap-3">
                    {finding.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.map(runText).join("").slice(0, 48)}
                        className="text-[#444444] [&_strong]:font-semibold [&_strong]:text-[#1a1a1a]"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-body)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.5,
                        }}
                      >
                        {paragraph.map((run) =>
                          typeof run === "string" ? (
                            run
                          ) : (
                            <strong key={run.strong}>{run.strong}</strong>
                          ),
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </LightSection>
  );
}
