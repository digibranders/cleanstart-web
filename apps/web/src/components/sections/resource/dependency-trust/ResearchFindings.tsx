import Image from "next/image";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/ui/Reveal";

import { FINDINGS, type Finding, type Run } from "./content";
import { GradientTitle, HAIRLINE_CARD, LightSection, STAT_GRADIENT } from "./parts";

const runText = (run: Run): string => (typeof run === "string" ? run : run.strong);

/** Column spans for the first four findings: a 7/5 row, then a 5/7 row. */
const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"] as const;

const BODY: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  letterSpacing: "-0.02em",
  lineHeight: 1.5,
};

const H3: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h4)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1.2,
  textWrap: "balance",
};

function Icon({ finding, size }: { finding: Finding; size: number }): React.ReactElement {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(169, 116, 255, 0.24) 0%, rgba(44, 193, 235, 0.08) 70%, rgba(255,255,255,0) 100%)",
        }}
      />
      <Image
        src={finding.icon}
        alt=""
        aria-hidden
        width={360}
        height={360}
        sizes={`${size}px`}
        className="relative object-contain"
        style={{ width: size, height: size }}
      />
    </span>
  );
}

function Heading({ finding, dark = false }: { finding: Finding; dark?: boolean }): React.ReactElement {
  return (
    <h3 style={{ ...H3, color: dark ? "#ffffff" : "#1a1a1a" }}>
      <span style={STAT_GRADIENT}>{finding.number}</span> {finding.title}
    </h3>
  );
}

function Paragraphs({ finding, dark = false }: { finding: Finding; dark?: boolean }): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {finding.paragraphs.map((paragraph) => (
        <p
          key={paragraph.map(runText).join("").slice(0, 40)}
          style={{ ...BODY, color: dark ? "rgba(255, 255, 255, 0.82)" : "#444444" }}
        >
          {paragraph.map((run) =>
            typeof run === "string" ? (
              run
            ) : (
              <strong key={run.strong} className="font-semibold" style={{ color: dark ? "#ffffff" : "#1a1a1a" }}>
                {run.strong}
              </strong>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

/**
 * Findings 01 to 04 sit in an offset grid; finding 05, which is the report's
 * conclusion, gets the dark full-width card so it reads as the payoff.
 */
export function ResearchFindings(): React.ReactElement {
  const supporting = FINDINGS.items.slice(0, SPANS.length);
  const conclusion = FINDINGS.items[SPANS.length];

  return (
    <LightSection dataSection="ResearchFindings">
      <Reveal header>
        <GradientTitle text={FINDINGS.heading} accent="reveals" />
      </Reveal>

      <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-12 lg:gap-6">
        {supporting.map((finding, index) => (
          <Reveal key={finding.id} y={24} delay={(index % 2) * 0.08} className={SPANS[index]}>
            <article
              id={finding.id}
              className="flex h-full flex-col gap-6"
              style={{ ...HAIRLINE_CARD, padding: "clamp(24px, 3vw, 40px)" }}
            >
              <Icon finding={finding} size={112} />
              <Heading finding={finding} />
              <Paragraphs finding={finding} />
            </article>
          </Reveal>
        ))}

        {conclusion && (
          <Reveal y={24} className="lg:col-span-12">
            <article
              id={conclusion.id}
              className="cs-grad-border relative flex flex-col gap-8 overflow-hidden rounded-[24px] text-white md:flex-row md:items-center md:justify-between"
              style={{
                padding: "clamp(28px, 4vw, 56px)",
                background: "linear-gradient(160deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
                boxShadow: "0 40px 90px -30px rgba(8,4,24,0.6), inset 0 1px 0 rgba(255,255,255,0.10)",
              }}
            >
              <div className="relative flex max-w-[640px] flex-col gap-4">
                <Heading finding={conclusion} dark />
                <Paragraphs finding={conclusion} dark />
              </div>
              <Icon finding={conclusion} size={200} />
            </article>
          </Reveal>
        )}
      </div>
    </LightSection>
  );
}
