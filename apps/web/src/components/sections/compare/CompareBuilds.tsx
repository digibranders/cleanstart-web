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
  Glyph,
  accentAt,
  type GlyphKey,
} from "./compare-visuals";

/**
 * Building from Source · Hermetic and Deterministic Builds · Reproducible Builds.
 *
 * Elevated visual designs:
 *  - Source-built: 4 elevated step cards with hairline top borders and glowing icon gems.
 *  - Hermetic: Vault card for enclosure definition + security restriction list.
 *  - Reproducible: Independent verification console with dual build nodes and '=' comparator.
 *
 * No em-dashes, no cheap eyebrows or artificial tags.
 */

const SOURCE_ICONS: readonly GlyphKey[] = [
  "origin",
  "compiler",
  "provenance",
  "binary",
];

export function CompareBuilds(): React.ReactElement {
  return (
    <>
      <ArticleSection label="compare-source-title" name="CompareSourceBuilt" className="!bg-[#fafafa]">
        <SectionHeading id="compare-source-title">
          {SOURCE_BUILT.heading}
        </SectionHeading>
        <Prose paragraphs={SOURCE_BUILT.body} lead />
        <ListLead>{SOURCE_BUILT.listLead}</ListLead>

        <RevealStagger className="my-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(SOURCE_BUILT.items ?? []).map((item, index) => {
            const accent = accentAt(index);
            return (
              <RevealItem key={item} className="h-full">
                <article
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                  style={{
                    borderColor: accent.border,
                    background: `linear-gradient(180deg, ${accent.fill} 0%, #ffffff 55%)`,
                    boxShadow: `0 8px 24px -12px ${accent.shadow}`,
                  }}
                >
                  {/* Top accent hairline */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: accent.light }}
                  />

                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <span
                        aria-hidden
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white transition-transform duration-300 group-hover:scale-110"
                        style={{
                          color: accent.light,
                          boxShadow: `0 8px 20px -6px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
                        }}
                      >
                        <Glyph icon={SOURCE_ICONS[index] ?? "check"} size={22} />
                      </span>
                    </div>

                    <p
                      className="font-display text-[#111111]"
                      style={{
                        fontSize: "var(--fs-h5)",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.35,
                      }}
                    >
                      {item}
                    </p>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealStagger>

        {SOURCE_BUILT.after && SOURCE_BUILT.after.length > 0 && (
          <Reveal className="mt-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p
                className="font-sans text-[#374151]"
                style={{
                  fontSize: "var(--fs-body)",
                  fontWeight: 500,
                  lineHeight: 1.6,
                  letterSpacing: "-0.01em",
                }}
              >
                {SOURCE_BUILT.after[0]}
              </p>
            </div>
          </Reveal>
        )}
      </ArticleSection>

      <ArticleSection label="compare-hermetic-title" name="CompareHermetic" className="!bg-white">
        <SectionHeading id="compare-hermetic-title">
          {HERMETIC.heading}
        </SectionHeading>
        <Prose paragraphs={[HERMETIC.body[0] ?? ""]} lead />

        <div className="my-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-10">
          {/* Left Side: The Hermetic Enclosure Vault Card */}
          <Reveal className="h-full">
            <div
              className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 sm:p-8"
              style={{
                borderColor: accentAt(2).border,
                background: `radial-gradient(130% 130% at 0% 0%, ${accentAt(2).fill} 0%, #ffffff 70%)`,
                boxShadow: `0 12px 32px -15px ${accentAt(2).shadow}`,
              }}
            >
              <div>
                <div className="mb-6">
                  <span
                    aria-hidden
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white"
                    style={{
                      color: accentAt(2).light,
                      boxShadow: `0 8px 20px -6px ${accentAt(2).shadow}, inset 0 0 0 1px ${accentAt(2).border}`,
                    }}
                  >
                    <Glyph icon="fips" size={24} />
                  </span>
                </div>

                <p
                  className="font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.4,
                    textWrap: "pretty",
                  }}
                >
                  {HERMETIC.body[1]}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right Side: Security Restriction List */}
          <div className="flex flex-col justify-between">
            <ListLead>{HERMETIC.listLead}</ListLead>
            <RevealStagger className="mt-4 flex flex-col gap-3">
              {(HERMETIC.items ?? []).map((item) => (
                <RevealItem key={item}>
                  <div className="group relative flex items-center gap-3.5 rounded-xl border border-red-200/70 bg-red-50/40 p-4 transition-all duration-200 hover:border-red-300 hover:bg-red-50/70">
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden
                      >
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3.5 10.5L10.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body)",
                        fontWeight: 500,
                        lineHeight: 1.4,
                        letterSpacing: "-0.01em",
                        color: "#374151",
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

        {/* Hermetic & Deterministic Principles */}
        <Prose paragraphs={[HERMETIC.after?.[0] ?? "", HERMETIC.after?.[1] ?? ""]} />

        {HERMETIC.after?.[2] && (
          <Reveal className="mt-6">
            <div
              className="relative overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-white p-6 sm:p-8"
              style={{
                boxShadow: "0 10px 28px -14px rgba(109, 40, 217, 0.16)",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6d28d9] text-white shadow-sm"
                >
                  <Glyph icon="seal" size={20} />
                </span>
                <div>
                  <p
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-h4)",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {HERMETIC.after[2]}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        )}
      </ArticleSection>

      <ArticleSection label="compare-reproducible-title" name="CompareReproducible" className="!bg-[#fafafa]">
        <SectionHeading id="compare-reproducible-title">
          {REPRODUCIBLE.heading}
        </SectionHeading>
        <P lead>{REPRODUCIBLE.lead}</P>

        {/* The Core Question Deck */}
        <Reveal header className="my-6">
          <div
            className="relative overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white p-6 sm:p-8"
            style={{
              boxShadow: "0 10px 30px -15px rgba(109, 40, 217, 0.15)",
            }}
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6d28d9] text-white shadow-md font-mono text-base font-bold"
              >
                ?
              </span>
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
            </div>
          </div>
        </Reveal>

        {/* Visual Deterministic Build Verification Console */}
        <Reveal delay={0.08} className="my-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
              {/* Build Node A */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-center gap-4">
                  <ArtifactMark />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-white">Builder Environment A</p>
                    <p className="font-sans text-xs text-slate-400 mt-1">Source Artifact Digest</p>
                  </div>
                </div>
              </div>

              {/* Equals Comparator */}
              <div className="flex flex-col items-center justify-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/40 font-mono text-xl font-bold shadow-inner">
                  =
                </span>
              </div>

              {/* Build Node B */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-center gap-4">
                  <ArtifactMark />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-white">Builder Environment B</p>
                    <p className="font-sans text-xs text-slate-400 mt-1">Source Artifact Digest</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Prose paragraphs={REPRODUCIBLE.body} />

        {/* High-Impact Pull Quote */}
        <Reveal header className="my-8">
          <blockquote className="relative overflow-hidden rounded-2xl border-l-4 border-[#6d28d9] bg-gradient-to-r from-purple-50/80 via-indigo-50/30 to-transparent p-6 sm:p-8">
            <p
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h3)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h3-ls)",
                lineHeight: 1.3,
                maxWidth: "32ch",
                textWrap: "balance",
              }}
            >
              {REPRODUCIBLE.pull}
            </p>
          </blockquote>
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



