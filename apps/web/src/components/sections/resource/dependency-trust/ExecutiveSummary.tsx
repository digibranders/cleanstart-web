import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";

import { EXECUTIVE_SUMMARY } from "./content";
import { Bezel, GradientTitle, PageSection, TONES } from "./parts";

const TONE = "light";
const STATEMENT_ACCENT = "establishing confidence in software before it is adopted";

const BODY_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.6,
  color: TONES[TONE].body,
} as const;

export function ExecutiveSummary(): React.ReactElement {
  const [lead, ...rest] = EXECUTIVE_SUMMARY.paragraphs;
  const { statement } = EXECUTIVE_SUMMARY;
  const accentAt = statement.indexOf(STATEMENT_ACCENT);
  const statementBefore = accentAt < 0 ? statement : statement.slice(0, accentAt);

  return (
    <PageSection dataSection="ExecutiveSummary" tone={TONE} fromHero>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal header className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <GradientTitle text={EXECUTIVE_SUMMARY.heading} accent="Summary" tone={TONE} align="left" />
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
                color: TONES[TONE].lead,
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

      {/* The one dark object on this light band: the report's conclusion. */}
      <Reveal y={28} className="mt-14 lg:mt-24">
        <Bezel
          tone={TONE}
          innerClassName="px-7 py-10 text-white sm:px-12 sm:py-14 lg:px-20 lg:py-20"
          innerStyle={{ background: "linear-gradient(160deg, #151021 0%, #131E8F 62%, #471EC0 100%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/cleanstart-images/env-union-hex.svg"
            alt=""
            className="pointer-events-none absolute -right-24 -top-20 hidden w-[520px] max-w-none select-none opacity-35 md:block"
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
            className="relative mt-8 max-w-[26ch] sm:max-w-[30ch]"
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
    </PageSection>
  );
}
