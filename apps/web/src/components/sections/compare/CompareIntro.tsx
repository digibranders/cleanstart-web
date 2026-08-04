import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { INTRO_BODY, INTRO_LEAD, OPENING_QUESTIONS } from "./compare-data";
import {
  AssuranceCard,
  Icon3D,
  LightBandDecor,
  WASH_LIGHT,
} from "./compare-visuals";

/**
 * The article's opening block, kept whole.
 *
 * In the source document everything between the title and the "At a Glance"
 * heading is one untitled run: the lead paragraph, the four questions, then
 * three closing paragraphs. No subheading divides it, so none is added here.
 *
 * The questions carry icons and no numbers: the document renders them as a
 * plain bulleted list, so numbering them would assert a sequence the source
 * does not.
 */

const QUESTION_ICONS: readonly string[] = [
  "/images/compare/icon-origin.webp",
  "/images/for-developers/why/icon-development.webp",
  "/images/about/icon-continuous-compliance.webp",
  "/images/compare/icon-regulatory.webp",
];

export function CompareIntro(): React.ReactElement {
  return (
    <Section
      data-section="CompareIntro"
      padding="lg"
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(246,246,246,0) 0%, ${WASH_LIGHT} 96px, ${WASH_LIGHT} calc(100% - 96px), rgba(246,246,246,0) 100%)`,
      }}
      aria-labelledby="compare-intro-lead"
    >
      <LightBandDecor />

      <Container className="relative">
        <Reveal header>
          <p
            id="compare-intro-lead"
            className="text-[#111111]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              lineHeight: 1.5,
              letterSpacing: "-0.015em",
              maxWidth: "52ch",
              textWrap: "pretty",
            }}
          >
            {INTRO_LEAD}
          </p>
        </Reveal>

        <RevealStagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OPENING_QUESTIONS.map((question, index) => (
            <RevealItem key={question} className="h-full">
              <AssuranceCard className="h-full">
                <Icon3D
                  src={QUESTION_ICONS[index] ?? QUESTION_ICONS[0] ?? ""}
                  size={76}
                  className="mb-5"
                />
                <p
                  className="font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h5)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.35,
                    textWrap: "balance",
                  }}
                >
                  {question}
                </p>
              </AssuranceCard>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal delay={0.16} className="mt-12 flex flex-col gap-5">
          {INTRO_BODY.map((text, index) => (
            <p
              key={text}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: index === 0 ? "var(--fs-lead-sm)" : "var(--fs-body)",
                fontWeight: index === 0 ? 500 : 400,
                lineHeight: 1.65,
                letterSpacing: "-0.01em",
                color: index === 0 ? "#111111" : "#4A4A4A",
                maxWidth: "68ch",
                textWrap: "pretty",
              }}
            >
              {text}
            </p>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
