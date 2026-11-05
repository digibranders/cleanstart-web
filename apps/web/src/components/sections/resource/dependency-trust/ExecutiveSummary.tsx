import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";

import { EXECUTIVE_SUMMARY } from "./content";
import { GradientTitle, HAIRLINE_CARD, LightSection } from "./parts";

const BODY_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.5,
  color: "#444444",
} as const;

export function ExecutiveSummary(): React.ReactElement {
  const [lead, ...rest] = EXECUTIVE_SUMMARY.paragraphs;

  return (
    <LightSection dataSection="ExecutiveSummary">
      <Reveal header>
        <GradientTitle text={EXECUTIVE_SUMMARY.heading} accent="Summary" />
      </Reveal>

      <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-12 lg:gap-6">
        <Reveal y={24} className="lg:col-span-7">
          <div className="h-full" style={{ ...HAIRLINE_CARD, padding: "clamp(24px, 3vw, 44px)" }}>
            <p
              style={{
                ...BODY_STYLE,
                fontSize: "var(--fs-lead-sm)",
                fontWeight: 500,
                color: "#1a1a1a",
              }}
            >
              {lead}
            </p>
            <div className="mt-6 flex flex-col gap-5">
              {rest.map((paragraph) => (
                <p key={paragraph} style={BODY_STYLE}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal y={24} delay={0.1} className="lg:col-span-5">
          <aside
            className="cs-grad-border relative flex h-full min-h-[300px] flex-col justify-between overflow-hidden rounded-[24px] text-white"
            style={{
              padding: "clamp(24px, 3vw, 44px)",
              background: "linear-gradient(160deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
              boxShadow: "0 40px 90px -30px rgba(8,4,24,0.6), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleanstart-images/env-union-hex.svg"
              alt=""
              className="pointer-events-none absolute -right-24 -top-16 w-[420px] max-w-none select-none opacity-40"
              loading="lazy"
              decoding="async"
            />
            <Image
              src="/images/security/cs-logomark.svg"
              alt=""
              aria-hidden
              width={44}
              height={44}
              className="relative"
            />
            <p
              className="relative mt-10"
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
    </LightSection>
  );
}
