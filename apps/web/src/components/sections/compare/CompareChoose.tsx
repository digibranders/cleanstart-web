import { Section, Container } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { CHOOSING, FINAL_THOUGHTS, WHICH_BETTER } from "./compare-data";
import { ArticleSection, Prose, SectionHeading } from "./compare-editorial";
import { Glow, Glyph, accentAt } from "./compare-visuals";

/**
 * Choosing the Right Approach · Which solution is better? · Final Thoughts.
 *
 * The two recommendations are the one place on this page where a panel is the
 * right affordance — this is a decision, and each option needs to be picked up
 * as a unit. They get identical weight and chrome, differing only in accent: the
 * article recommends Docker Hardened Images without qualification for a real set
 * of buyers, and dressing our side up would misrepresent it.
 *
 * Final Thoughts closes on a dark band so the article ends where the hero began.
 */
export function CompareChoose(): React.ReactElement {
  const options = [
    { ...CHOOSING.dhi, icon: "image" as const, accent: accentAt(1) },
    { ...CHOOSING.cleanstart, icon: "build" as const, accent: accentAt(0) },
  ];

  return (
    <>
      <ArticleSection label="compare-choosing-title" name="CompareChoosing">
        <SectionHeading id="compare-choosing-title">
          {CHOOSING.heading}
        </SectionHeading>
        <Prose paragraphs={CHOOSING.body} lead />

        <RevealStagger className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {options.map((option, index) => (
            <RevealItem key={option.name} className="h-full">
              <article
                className="relative flex h-full flex-col overflow-hidden"
                style={{
                  borderRadius: index === 0 ? "12px 12px 12px 56px" : "12px 56px 12px 12px",
                  border: `1px solid ${option.accent.border}`,
                  background: `radial-gradient(130% 130% at ${index === 0 ? "0% 100%" : "100% 0%"}, ${option.accent.fill} 0%, #ffffff 66%)`,
                  padding: "clamp(24px, 2.4vw, 40px)",
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white"
                    style={{
                      color: option.accent.light,
                      boxShadow: `0 8px 20px -8px ${option.accent.shadow}, inset 0 0 0 1px ${option.accent.border}`,
                    }}
                  >
                    <Glyph icon={option.icon} size={23} />
                  </span>
                  <h3
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-h4)",
                      fontWeight: 600,
                      letterSpacing: "var(--fs-h4-ls)",
                      lineHeight: "var(--fs-h4-lh)",
                    }}
                  >
                    {option.name}
                  </h3>
                </div>
                <p
                  className="mt-5 text-[#3A3A3A]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    lineHeight: 1.6,
                    letterSpacing: "-0.01em",
                    textWrap: "pretty",
                  }}
                >
                  {option.text}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>

        <Prose paragraphs={[CHOOSING.close]} />
      </ArticleSection>

      <ArticleSection
        label="compare-which-better-title"
        name="CompareWhichBetter"
        className="!bg-[#f7f7f7]"
      >
        <SectionHeading id="compare-which-better-title">
          {WHICH_BETTER.heading}
        </SectionHeading>
        <Prose paragraphs={WHICH_BETTER.body} />
      </ArticleSection>

      <Section
        data-section="CompareFinalThoughts"
        padding="lg"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #151021 0%, #131E8F 68%, #471EC0 100%)",
        }}
        aria-labelledby="compare-final-title"
      >
        <Glow color="rgba(110,64,255,0.2)" size="min(700px, 48%)" left="50%" top="-20%" />

        <Container className="relative">
          <div className="mx-auto max-w-[820px] text-center">
            <Reveal header>
              <h2
                id="compare-final-title"
                className="font-display text-white/60"
                style={{
                  fontSize: "var(--fs-h5)",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                }}
              >
                {FINAL_THOUGHTS.heading}
              </h2>
            </Reveal>
            <Reveal header delay={0.08}>
              <p
                className="mx-auto mt-6 font-display text-white"
                style={{
                  fontSize: "var(--fs-h2)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  maxWidth: "24ch",
                  textWrap: "balance",
                }}
              >
                {FINAL_THOUGHTS.pull}
              </p>
            </Reveal>
            <Reveal delay={0.16} className="mt-8 flex flex-col gap-4">
              {FINAL_THOUGHTS.body.map((text) => (
                <p
                  key={text}
                  className="mx-auto max-w-[62ch] text-white/76"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    lineHeight: 1.65,
                    letterSpacing: "-0.01em",
                    textWrap: "pretty",
                  }}
                >
                  {text}
                </p>
              ))}
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
