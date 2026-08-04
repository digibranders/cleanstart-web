import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import {
  CHOOSING,
  FINAL_THOUGHTS,
  WHICH_BETTER,
  WHICH_BETTER_ALT_HEADING,
} from "./compare-data";
import { P, Prose, SectionHeading } from "./compare-editorial";
import {
  BAND_DARK,
  EllipseGlow,
  RULE_LIGHT,
} from "./compare-visuals";

/**
 * Choosing the Right Approach · Is CleanStart the Right Alternative · Which
 * solution is better? · Final Thoughts.
 *
 * The two recommendations are the one place on this page where a panel is the
 * right affordance — this is a decision, and each option has to be picked up as
 * a unit. They get identical chrome and differ only in tint: the article
 * recommends Docker Hardened Images without qualification for a real set of
 * buyers, and dressing our side up would misrepresent it.
 *
 * Final Thoughts closes on a dark band, so the article ends where the hero
 * began.
 */

const OPTIONS = [
  {
    ...CHOOSING.dhi,
    logo: "/images/cleanstart-images/workflows-docker.webp",
    branded: false,
  },
  {
    ...CHOOSING.cleanstart,
    logo: "/images/security/cs-logomark.svg",
    branded: true,
  },
] as const;

export function CompareChoose(): React.ReactElement {
  return (
    <>
      <Section
        data-section="CompareChoosing"
        padding="lg"
        className="relative overflow-hidden bg-white"
        aria-labelledby="compare-choosing-title"
      >
        <Container className="relative flex flex-col gap-[clamp(48px,4.4vw,76px)]">
          <div className="flex flex-col gap-6 md:gap-7">
            <SectionHeading id="compare-choosing-title">
              {CHOOSING.heading}
            </SectionHeading>
            <Prose paragraphs={CHOOSING.body} lead />
          </div>

          <div className="flex flex-col gap-6 md:gap-7">
            {/* H3, not H2. The source document sets "Which solution is
                better?" at its own H2 level (one below every section heading),
                and the SEO comment asks for this alternative-intent heading to
                be added "as an h2" — i.e. as that heading's sibling. Both
                therefore sit under the Choosing H2. */}
            <SectionHeading id="compare-alternative-title" size="h3">
              {WHICH_BETTER_ALT_HEADING}
            </SectionHeading>

            <RevealStagger className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {OPTIONS.map((option) => (
                <RevealItem key={option.name} className="h-full">
                  <article
                    className="relative flex h-full flex-col overflow-hidden"
                    style={{
                      borderRadius: "24px",
                      background: option.branded
                        ? "linear-gradient(150deg, #ffffff 0%, #ffffff 34%, #F3EBFF 78%, #E9DBFF 100%)"
                        : "#FFFFFF",
                      border: option.branded
                        ? "1.5px solid rgba(138,92,246,0.30)"
                        : "1.5px solid rgba(0,0,0,0.07)",
                      padding: "clamp(24px, 2.3vw, 38px)",
                      boxShadow: option.branded
                        ? "0 1px 2px rgba(17,17,17,0.04), 0 16px 38px -20px rgba(70,30,190,0.22)"
                        : "0 1px 2px rgba(17,17,17,0.04)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Both marks sit on the same dark tile. The CleanStart
                          logomark is white-and-cyan, so it needs a dark ground;
                          giving Docker's mark a white tile instead would make
                          the pair look accidental rather than compared. */}
                      <span
                        aria-hidden
                        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                          background: "#1B1440",
                          boxShadow:
                            "inset 0 0 0 1px rgba(255,255,255,0.12), 0 6px 16px -8px rgba(27,20,64,0.5)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={option.logo}
                          alt=""
                          aria-hidden
                          className="pointer-events-none select-none"
                          style={{ width: 30, height: 30, objectFit: "contain" }}
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                      {/* Not a heading. The source document sets these two
                          vendor names as labels inside the recommendation
                          copy, not as document structure; promoting them to
                          H3 would add two headings the SEO outline does not
                          have. */}
                      <p
                        className="font-display text-[#111111]"
                        style={{
                          fontSize: "var(--fs-h4)",
                          fontWeight: 600,
                          letterSpacing: "var(--fs-h4-ls)",
                          lineHeight: 1.2,
                        }}
                      >
                        {option.name}
                      </p>
                    </div>

                    <p
                      className="mt-6"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body)",
                        lineHeight: 1.65,
                        letterSpacing: "-0.01em",
                        color: option.branded ? "#241A4D" : "#4A4A4A",
                      }}
                    >
                      {option.text}
                    </p>
                  </article>
                </RevealItem>
              ))}
            </RevealStagger>

            <Reveal>
              <P>{CHOOSING.close}</P>
            </Reveal>
          </div>

          <div
            className="flex flex-col gap-6 md:gap-7"
            style={{ borderTop: RULE_LIGHT, paddingTop: "clamp(40px, 3.6vw, 64px)" }}
          >
            <SectionHeading id="compare-which-better-title" size="h3">
              {WHICH_BETTER.heading}
            </SectionHeading>
            <Prose paragraphs={WHICH_BETTER.body} />
          </div>
        </Container>
      </Section>

      {/* ── Final Thoughts ── */}
      <Section
        data-section="CompareFinalThoughts"
        padding="lg"
        className="relative overflow-hidden"
        style={{ background: BAND_DARK }}
        aria-labelledby="compare-final-title"
      >
        <EllipseGlow side="right" />

        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
            <div>
              <Reveal header>
                <h2
                  id="compare-final-title"
                  className="font-display text-white"
                  style={{
                    fontSize: "var(--fs-h2)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h2-ls)",
                    lineHeight: "var(--fs-h2-lh)",
                  }}
                >
                  {FINAL_THOUGHTS.heading}
                </h2>
              </Reveal>
              <Reveal header delay={0.08}>
                <p
                  className="mt-6 font-display"
                  style={{
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h3-ls)",
                    lineHeight: 1.3,
                    maxWidth: "24ch",
                    textWrap: "balance",
                    color: "#C9A6FF",
                  }}
                >
                  {FINAL_THOUGHTS.pull}
                </p>
              </Reveal>
            </div>

            <div className="flex flex-col gap-5 lg:pt-2">
              {FINAL_THOUGHTS.body.map((text, index) => (
                <Reveal key={text} delay={index * 0.06}>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      lineHeight: 1.65,
                      letterSpacing: "-0.01em",
                      color:
                        index === FINAL_THOUGHTS.body.length - 1
                          ? "#ffffff"
                          : "rgba(255,255,255,0.78)",
                      fontWeight:
                        index === FINAL_THOUGHTS.body.length - 1 ? 600 : 400,
                      maxWidth: "62ch",
                      textWrap: "pretty",
                    }}
                  >
                    {text}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
