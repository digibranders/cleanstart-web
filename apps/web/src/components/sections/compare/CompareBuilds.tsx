import { RevealItem, RevealStagger, Reveal } from "@/components/ui/Reveal";
import { HERMETIC, REPRODUCIBLE, SOURCE_BUILT } from "./compare-data";
import {
  ArticleSection,
  ListLead,
  P,
  Prose,
  SectionHeading,
} from "./compare-editorial";
import {
  AccentPanel,
  Glyph,
  accentAt,
  type Corner,
  type GlyphKey,
} from "./compare-visuals";

/**
 * Building from Source · Hermetic and Deterministic Builds · Reproducible Builds.
 *
 * Three consecutive article sections, each with its own device:
 *  – source-built capabilities as four accent panels with rotating corners,
 *  – the hermetic boundary drawn as an actual enclosure with the four things it
 *    cannot do placed outside it,
 *  – reproducibility as two identical artifacts either side of an equals sign.
 *
 * Each device reads the copy rather than decorating it, which is why the three
 * do not look alike.
 */

const SOURCE_ICONS: readonly GlyphKey[] = [
  "origin",
  "compiler",
  "provenance",
  "binary",
];
const CORNERS: readonly Corner[] = ["tl", "tr", "br", "bl"];

export function CompareBuilds(): React.ReactElement {
  return (
    <>
      <ArticleSection label="compare-source-title" name="CompareSourceBuilt">
        <SectionHeading id="compare-source-title">
          {SOURCE_BUILT.heading}
        </SectionHeading>
        <Prose paragraphs={SOURCE_BUILT.body} lead />
        <ListLead>{SOURCE_BUILT.listLead}</ListLead>

        <RevealStagger className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(SOURCE_BUILT.items ?? []).map((item, index) => (
            <RevealItem key={item} className="h-full">
              <AccentPanel
                icon={SOURCE_ICONS[index] ?? "check"}
                accent={accentAt(index)}
                corner={CORNERS[index] ?? "tl"}
                title={item}
              />
            </RevealItem>
          ))}
        </RevealStagger>

        <Prose paragraphs={SOURCE_BUILT.after ?? []} />
      </ArticleSection>

      <ArticleSection label="compare-hermetic-title" name="CompareHermetic">
        <SectionHeading id="compare-hermetic-title">
          {HERMETIC.heading}
        </SectionHeading>
        <Prose paragraphs={[HERMETIC.body[0] ?? ""]} lead />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
          {/* The enclosure: a dashed boundary holding the definition. */}
          <Reveal>
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: "20px",
                border: `1.5px dashed ${accentAt(2).border}`,
                background: `radial-gradient(130% 130% at 50% 0%, ${accentAt(2).fill} 0%, #ffffff 70%)`,
                padding: "clamp(24px, 2.4vw, 40px)",
              }}
            >
              <span
                aria-hidden
                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white"
                style={{
                  color: accentAt(2).light,
                  boxShadow: `0 6px 16px -6px ${accentAt(2).shadow}, inset 0 0 0 1px ${accentAt(2).border}`,
                }}
              >
                <Glyph icon="fips" size={21} />
              </span>
              <P>{HERMETIC.body[1]}</P>
            </div>
          </Reveal>

          {/* Outside the boundary: what it cannot reach. */}
          <div>
            <ListLead>{HERMETIC.listLead}</ListLead>
            <RevealStagger className="mt-5 flex flex-col">
              {(HERMETIC.items ?? []).map((item) => (
                <RevealItem key={item}>
                  <div
                    className="flex items-start gap-4"
                    style={{
                      borderTop: "1px solid rgba(17,17,17,0.11)",
                      paddingTop: "clamp(12px, 1.1vw, 16px)",
                      paddingBottom: "clamp(12px, 1.1vw, 16px)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: "rgba(17,17,17,0.045)",
                        color: "#6B6B6B",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        aria-hidden
                      >
                        <circle
                          cx="6.5"
                          cy="6.5"
                          r="5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                        <path
                          d="m3.4 9.6 6.2-6.2"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body)",
                        lineHeight: 1.45,
                        letterSpacing: "-0.01em",
                        color: "#6B6B6B",
                        textDecoration: "line-through",
                        textDecorationColor: "rgba(17,17,17,0.28)",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>

        <Prose paragraphs={HERMETIC.after ?? []} />
      </ArticleSection>

      <ArticleSection label="compare-reproducible-title" name="CompareReproducible">
        <SectionHeading id="compare-reproducible-title">
          {REPRODUCIBLE.heading}
        </SectionHeading>
        <P lead>{REPRODUCIBLE.lead}</P>

        <Reveal header>
          <p
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h3-ls)",
              lineHeight: 1.3,
              maxWidth: "36ch",
              textWrap: "balance",
            }}
          >
            {REPRODUCIBLE.question}
          </p>
        </Reveal>

        {/* Same source in, same artifact out. */}
        <Reveal delay={0.08}>
          <div
            className="flex flex-wrap items-center gap-6 sm:gap-10"
            style={{ paddingTop: "clamp(8px, 1vw, 16px)" }}
          >
            <ArtifactMark />
            <span
              aria-hidden
              className="font-display text-[#111111]"
              style={{ fontSize: "var(--fs-h3)", fontWeight: 400, opacity: 0.5 }}
            >
              =
            </span>
            <ArtifactMark />
          </div>
        </Reveal>

        <Prose paragraphs={REPRODUCIBLE.body} />

        <Reveal header>
          <p
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h3-ls)",
              lineHeight: 1.3,
              maxWidth: "30ch",
              textWrap: "balance",
            }}
          >
            {REPRODUCIBLE.pull}
          </p>
        </Reveal>

        <Prose paragraphs={[REPRODUCIBLE.close]} />
      </ArticleSection>
    </>
  );
}

/** One artifact glyph in a tinted disc — used twice, either side of the equals. */
function ArtifactMark(): React.ReactElement {
  const accent = accentAt(0);
  return (
    <span
      aria-hidden
      className="inline-flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[22px] bg-white"
      style={{
        color: accent.light,
        boxShadow: `0 10px 26px -12px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
        background: `radial-gradient(120% 120% at 30% 0%, ${accent.fill} 0%, #ffffff 70%)`,
      }}
    >
      <Glyph icon="packages" size={30} />
    </span>
  );
}
