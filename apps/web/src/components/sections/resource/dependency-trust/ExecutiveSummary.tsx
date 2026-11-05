import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";

import { EXECUTIVE_SUMMARY } from "./content";
import { Bezel, DarkSection, GradientTitle } from "./parts";

const STATEMENT_ACCENT = "establishing confidence in software before it is adopted";

const BODY_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.6,
  color: "rgba(255, 255, 255, 0.68)",
} as const;

export function ExecutiveSummary(): React.ReactElement {
  const [lead, ...rest] = EXECUTIVE_SUMMARY.paragraphs;
  const { statement } = EXECUTIVE_SUMMARY;
  const accentAt = statement.indexOf(STATEMENT_ACCENT);
  const statementBefore = accentAt < 0 ? statement : statement.slice(0, accentAt);

  return (
    <DarkSection dataSection="ExecutiveSummary" fromHero>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal header className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <GradientTitle text={EXECUTIVE_SUMMARY.heading} accent="Summary" align="left" />
          </div>
        </Reveal>

        <Reveal y={24} delay={0.08} className="lg:col-span-7">
          <div className="flex flex-col gap-6">
            <p
              style={{
                ...BODY_STYLE,
                fontSize: "var(--fs-lead-sm)",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "rgba(255, 255, 255, 0.94)",
              }}
            >
              {lead}
            </p>
            {rest.map((paragraph) => (
              <p key={paragraph} style={BODY_STYLE}>
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal y={28} className="mt-14 lg:mt-24">
        <Bezel
          innerClassName="px-7 py-10 sm:px-12 sm:py-14 lg:px-20 lg:py-20"
          innerStyle={{
            background:
              "radial-gradient(70% 120% at 100% 0%, rgba(79, 30, 192, 0.55) 0%, rgba(79, 30, 192, 0) 60%), linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/cleanstart-images/env-union-hex.svg"
            alt=""
            className="pointer-events-none absolute -right-24 -top-20 hidden w-[520px] max-w-none select-none opacity-30 md:block"
            loading="lazy"
            decoding="async"
          />
          <Image
            src="/images/security/cs-logomark.svg"
            alt=""
            aria-hidden
            width={44}
            height={44}
            sizes="44px"
            className="relative"
          />
          <p
            className="relative mt-8 max-w-[26ch] text-white sm:max-w-[30ch]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              textWrap: "balance",
            }}
          >
            {statementBefore}
            {accentAt >= 0 && <span className="cs-text-gradient-impact">{STATEMENT_ACCENT}</span>}
          </p>
        </Bezel>
      </Reveal>
    </DarkSection>
  );
}
