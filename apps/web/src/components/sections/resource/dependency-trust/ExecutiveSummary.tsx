import Image from "next/image";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/ui/Reveal";

import { EXECUTIVE_SUMMARY } from "./content";
import { GradientTitle, HAIRLINE_CARD, LightSection } from "./parts";

const BODY_STYLE: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.5,
  color: "#444444",
};

/** The paragraph's own first sentence, so it can lead without any new copy. */
function splitLead(paragraph: string): { lead: string; rest: string } {
  const match = /^(.+?[.:])\s+(.+)$/s.exec(paragraph);
  const lead = match?.[1];
  const rest = match?.[2];
  return lead !== undefined && rest !== undefined ? { lead, rest } : { lead: paragraph, rest: "" };
}

export function ExecutiveSummary(): React.ReactElement {
  const [opening, ...points] = EXECUTIVE_SUMMARY.paragraphs;
  const { lead, rest } = splitLead(opening);

  return (
    <LightSection dataSection="ExecutiveSummary">
      <Reveal header>
        <GradientTitle text={EXECUTIVE_SUMMARY.heading} accent="Summary" />
      </Reveal>

      <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-12 lg:gap-6">
        <Reveal y={24} className="flex flex-col justify-center lg:col-span-7">
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.25,
              color: "#111111",
              textWrap: "balance",
            }}
          >
            {lead} <span style={{ color: "#6b6b7a", fontWeight: 500 }}>{rest}</span>
          </p>
        </Reveal>

        <Reveal y={24} delay={0.1} className="lg:col-span-5">
          <aside
            className="cs-grad-border relative flex h-full flex-col items-start gap-6 overflow-hidden rounded-[24px] text-white"
            style={{
              padding: "clamp(28px, 4vw, 56px)",
              background: "linear-gradient(160deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
              boxShadow: "0 40px 90px -30px rgba(8,4,24,0.6), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-28 -top-28 h-[480px] w-[480px] select-none rounded-full"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(circle closest-side, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 32px)",
                maskImage: "radial-gradient(closest-side, #000 25%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "radial-gradient(closest-side, #000 25%, rgba(0,0,0,0) 100%)",
              }}
            />
            <Image
              src="/images/security/cs-logomark.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              sizes="40px"
              className="relative"
            />
            <p
              className="relative max-w-[30ch]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h3)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.2,
                textWrap: "balance",
              }}
            >
              {EXECUTIVE_SUMMARY.statement}
            </p>
          </aside>
        </Reveal>
      </div>

      <Reveal y={24} className="mt-5">
        <div className="grid md:grid-cols-3 md:divide-x md:divide-[#9A51FF]/15" style={HAIRLINE_CARD}>
          {points.map((point) => {
            const part = splitLead(point);
            return (
              <p key={point.slice(0, 32)} className="p-6 md:p-8" style={BODY_STYLE}>
                <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{part.lead}</span> {part.rest}
              </p>
            );
          })}
        </div>
      </Reveal>
    </LightSection>
  );
}
