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

        <RevealStagger className="my-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {options.map((option) => (
            <RevealItem key={option.name} className="h-full">
              <article
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                style={{
                  borderColor: option.accent.border,
                  background: `linear-gradient(180deg, ${option.accent.fill} 0%, #ffffff 50%)`,
                  boxShadow: `0 10px 30px -15px ${option.accent.shadow}`,
                }}
              >
                {/* Top accent hairline */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: option.accent.light }}
                />

                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <span
                      aria-hidden
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white transition-transform duration-300 group-hover:scale-110"
                      style={{
                        color: option.accent.light,
                        boxShadow: `0 8px 20px -6px ${option.accent.shadow}, inset 0 0 0 1px ${option.accent.border}`,
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
                    className="text-[#374151]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      lineHeight: 1.65,
                      letterSpacing: "-0.01em",
                      textWrap: "pretty",
                    }}
                  >
                    {option.text}
                  </p>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal className="mt-4">
          <div
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 sm:p-7"
          >
            <p
              className="font-sans text-[#4A4A4A]"
              style={{
                fontSize: "var(--fs-body)",
                fontWeight: 500,
                lineHeight: 1.6,
                letterSpacing: "-0.01em",
              }}
            >
              {CHOOSING.close}
            </p>
          </div>
        </Reveal>
      </ArticleSection>

      <ArticleSection
        label="compare-which-better-title"
        name="CompareWhichBetter"
        className="!bg-[#fbfbfb]"
      >
        <SectionHeading id="compare-which-better-title">
          {WHICH_BETTER.heading}
        </SectionHeading>
        {WHICH_BETTER.body[0] && (
          <Prose paragraphs={[WHICH_BETTER.body[0]]} lead />
        )}

        {/* Dual Recommendation Guidance Cards */}
        {WHICH_BETTER.body.length >= 3 && (
          <RevealStagger className="my-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card 1: DHI Priority */}
            <RevealItem className="h-full">
              <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-white p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-blue-500" />
                <div className="mb-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"
                  >
                    <Glyph icon="image" size={20} />
                  </span>
                  <h3 className="font-display text-base font-semibold text-[#111111]">
                    Docker Hardened Images
                  </h3>
                </div>
                <p
                  className="text-[#374151]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    lineHeight: 1.65,
                    letterSpacing: "-0.01em",
                    textWrap: "pretty",
                  }}
                >
                  {WHICH_BETTER.body[1]}
                </p>
              </article>
            </RevealItem>

            {/* Card 2: CleanStart Priority */}
            <RevealItem className="h-full">
              <article
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-purple-300/80 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white p-6 sm:p-7 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ boxShadow: "0 12px 32px -16px rgba(109, 40, 217, 0.2)" }}
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[#6d28d9]" />
                <div className="mb-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6d28d9] text-white shadow-sm"
                  >
                    <Glyph icon="build" size={20} />
                  </span>
                  <h3 className="font-display text-base font-semibold text-[#111111]">
                    CleanStart
                  </h3>
                </div>
                <p
                  className="text-[#111111]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    fontWeight: 500,
                    lineHeight: 1.65,
                    letterSpacing: "-0.01em",
                    textWrap: "pretty",
                  }}
                >
                  {WHICH_BETTER.body[2]}
                </p>
              </article>
            </RevealItem>
          </RevealStagger>
        )}
      </ArticleSection>

      <Section
        data-section="CompareFinalThoughts"
        padding="sm"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #120D22 0%, #171038 50%, #291461 100%)",
        }}
        aria-labelledby="compare-final-title"
      >
        <Glow color="rgba(147, 51, 234, 0.25)" size="min(600px, 45%)" left="50%" top="-15%" />
        <Glow color="rgba(59, 130, 246, 0.18)" size="min(500px, 35%)" right="-10%" bottom="-20%" />

        <Container className="relative z-10">
          <div className="mx-auto max-w-[760px]">
            {/* Compact Keynote Glass Card Container */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl shadow-xl">
              <Reveal header className="text-center">
                <span
                  aria-hidden
                  className="mx-auto mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-purple-300 border border-white/20 shadow-inner"
                >
                  <Glyph icon="seal" size={18} />
                </span>
                <h2
                  id="compare-final-title"
                  className="font-display text-xs font-semibold uppercase tracking-wider text-purple-300/80"
                >
                  {FINAL_THOUGHTS.heading}
                </h2>
              </Reveal>

              <Reveal header delay={0.08} className="text-center">
                <p
                  className="mx-auto mt-3 font-display text-white"
                  style={{
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h3-ls)",
                    lineHeight: 1.3,
                    maxWidth: "28ch",
                    textWrap: "balance",
                  }}
                >
                  {FINAL_THOUGHTS.pull}
                </p>
              </Reveal>

              <Reveal delay={0.16} className="mt-5 flex flex-col gap-4 text-center">
                {FINAL_THOUGHTS.body.slice(0, 2).map((text) => (
                  <p
                    key={text}
                    className="mx-auto max-w-[58ch] text-white/80"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      lineHeight: 1.6,
                      letterSpacing: "-0.01em",
                      textWrap: "pretty",
                    }}
                  >
                    {text}
                  </p>
                ))}
              </Reveal>

              {FINAL_THOUGHTS.body[2] && (
                <Reveal delay={0.24} className="mt-6">
                  <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4 text-center backdrop-blur-md">
                    <p
                      className="font-display text-white"
                      style={{
                        fontSize: "var(--fs-body)",
                        fontWeight: 600,
                        lineHeight: 1.45,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {FINAL_THOUGHTS.body[2]}
                    </p>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
