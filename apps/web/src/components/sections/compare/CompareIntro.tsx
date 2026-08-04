import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { INTRO_BODY, INTRO_LEAD, OPENING_QUESTIONS } from "./compare-data";
import { Glyph, accentAt, type GlyphKey } from "./compare-visuals";

/** Shared with the hero, which fades into it, so the boundary has no seam. */
export const INTRO_BG = "#F9F8FE";

/**
 * The article's opening block, kept whole.
 *
 * In the source document everything between the title and the "At a Glance"
 * heading is one untitled run: the lead paragraph, the four questions, then
 * three closing paragraphs. No subheading divides it. The page previously split
 * that run across two differently-styled sections — bullets on the dark band,
 * closing paragraphs stranded at the top of the white matrix — which the
 * document does not do.
 *
 * Its own tinted band, distinct from both the dark hero above and the white
 * matrix below, so it reads as a section rather than hero spill-over.
 *
 * The questions carry icons and no numbers: the document renders them as a
 * plain bulleted list (`numFmt="bullet"`), so numbering them would assert a
 * sequence the source does not.
 */

const QUESTION_ICONS: readonly GlyphKey[] = [
  "origin",
  "compiler",
  "signature",
  "stig",
];

export function CompareIntro(): React.ReactElement {
  return (
    <Section
      data-section="CompareIntro"
      padding="lg"
      className="relative"
      style={{ background: INTRO_BG }}
      aria-labelledby="compare-intro-lead"
    >
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

        <Reveal delay={0.1} className="mt-10">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OPENING_QUESTIONS.map((question, index) => {
              const accent = accentAt(index);
              return (
                <li key={question} className="h-full">
                  <div
                    className="group flex h-full flex-col gap-6 rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      borderColor: accent.border,
                      background: `linear-gradient(180deg, ${accent.fill} 0%, #ffffff 62%)`,
                      boxShadow: `0 10px 28px -18px ${accent.shadow}`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white transition-transform duration-300 group-hover:scale-105"
                      style={{
                        color: accent.light,
                        boxShadow: `0 6px 16px -6px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
                      }}
                    >
                      <Glyph icon={QUESTION_ICONS[index] ?? "check"} size={21} />
                    </span>

                    <span
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
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

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
