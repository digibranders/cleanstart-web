import { Section, Container } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { BEYOND_CVES } from "./compare-data";
import {
  ArticleSection,
  ListLead,
  P,
  Prose,
  SectionHeading,
} from "./compare-editorial";
import {
  Glow,
  Glyph,
  ThreadStyles,
  accentAt,
  type GlyphKey,
} from "./compare-visuals";

/**
 * Security: More Than Reducing CVEs.
 *
 * Two movements. The light half lists what hardening buys, as an icon-disc row.
 * The dark half is the article's own turn — one question answered, five left
 * open — and is the page's showpiece: the answered question at display scale
 * facing a numbered chain of the five open ones, threaded by a vertical rail
 * with a travelling pulse.
 */

const BENEFIT_ICONS: readonly GlyphKey[] = [
  "shrink",
  "packages",
  "remediate",
  "overhead",
  "surface",
];

export function CompareBeyondCves(): React.ReactElement {
  return (
    <>
      <ArticleSection label="compare-beyond-cves-title" name="CompareBeyondCves">
        <SectionHeading id="compare-beyond-cves-title">
          {BEYOND_CVES.heading}
        </SectionHeading>
        <Prose paragraphs={BEYOND_CVES.body} lead />
        <ListLead>{BEYOND_CVES.benefitsLead}</ListLead>

        <RevealStagger className="mt-2 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
          {BEYOND_CVES.benefits.map((benefit, index) => {
            const accent = accentAt(index);
            return (
              <RevealItem key={benefit}>
                <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-4">
                  <span
                    aria-hidden
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white"
                    style={{
                      color: accent.light,
                      boxShadow: `0 6px 16px -6px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
                    }}
                  >
                    <Glyph icon={BENEFIT_ICONS[index] ?? "check"} size={21} />
                  </span>
                  <span
                    className="text-[#111111]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      fontWeight: 500,
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                      textWrap: "balance",
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </ArticleSection>

      <Section
        data-section="CompareBeyondCvesTurn"
        padding="lg"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
        }}
      >
        <ThreadStyles />
        <Glow color="rgba(110,64,255,0.24)" size="min(680px, 46%)" right="-8%" top="-14%" />
        <Glow color="rgba(44,193,235,0.16)" size="min(520px, 38%)" left="-6%" bottom="-18%" />

        <Container className="relative">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="lg:pt-2">
              <Reveal header>
                <P inverse>{BEYOND_CVES.pivot}</P>
              </Reveal>
              <Reveal header delay={0.08}>
                <p
                  className="font-display text-white"
                  style={{
                    fontSize: "var(--fs-h2)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    maxWidth: "20ch",
                    textWrap: "balance",
                    marginTop: "clamp(16px, 1.6vw, 24px)",
                  }}
                >
                  {BEYOND_CVES.answered}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <p
                  className="mt-8 max-w-[46ch] text-white/70"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    lineHeight: 1.6,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {BEYOND_CVES.close}
                </p>
              </Reveal>
            </div>

            <div className="relative">
              <Reveal>
                <ListLead inverse>{BEYOND_CVES.unansweredLead}</ListLead>
              </Reveal>

              <div className="relative mt-8">
                {/* Vertical rail threading the five open questions. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[17px] top-2 hidden w-[2px] select-none overflow-hidden rounded-full sm:block"
                  style={{
                    bottom: "1.5rem",
                    background:
                      "linear-gradient(180deg, rgba(169,116,255,0), rgba(169,116,255,0.55), rgba(91,155,255,0.55), rgba(45,212,191,0.55), rgba(247,163,92,0))",
                  }}
                >
                  <div className="cmp-thread-pulse-v absolute inset-0" />
                </span>

                <RevealStagger className="flex flex-col gap-7">
                  {BEYOND_CVES.unanswered.map((question, index) => {
                    const accent = accentAt(index);
                    return (
                      <RevealItem key={question}>
                        <div className="flex items-center gap-5">
                          <span
                            aria-hidden
                            className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full tabular-nums"
                            style={{
                              color: "#ffffff",
                              background: "rgba(255,255,255,0.06)",
                              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent.dark} 55%, transparent)`,
                              backdropFilter: "blur(6px)",
                              fontFamily: "var(--font-sans)",
                              fontSize: "var(--fs-body-sm)",
                              fontWeight: 600,
                            }}
                          >
                            {index + 1}
                          </span>
                          <span
                            className="font-display text-white"
                            style={{
                              fontSize: "var(--fs-h5)",
                              fontWeight: 500,
                              letterSpacing: "-0.02em",
                              lineHeight: 1.35,
                            }}
                          >
                            {question}
                          </span>
                        </div>
                      </RevealItem>
                    );
                  })}
                </RevealStagger>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
