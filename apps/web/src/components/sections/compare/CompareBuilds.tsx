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

        {/* The Core Question Deck — Refined Editorial Callout */}
        <Reveal header className="my-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-sm font-bold shadow-sm"
              >
                ?
              </span>
              <p
                className="font-display text-[#111111]"
                style={{
                  fontSize: "var(--fs-h3)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-h3-ls)",
                  lineHeight: 1.35,
                  maxWidth: "38ch",
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
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f17] text-white shadow-2xl">
            {/* Console Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0e1420] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                </div>
                <span className="font-mono text-xs text-slate-400 font-medium tracking-wide ml-2">
                  DETERMINISTIC_BUILD_COMPARATOR
                </span>
              </div>
            </div>

            {/* Console Content: Dual Build Paths */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Build Node A */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 p-5 font-mono">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Primary Build Pipeline (A)
                      </span>
                      <span className="text-[11px] text-slate-500">x86_64-linux</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Source Commit</span>
                        <span className="text-slate-200">git: 8f9a2e1d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Compiler Flags</span>
                        <span className="text-slate-300">--hermetic --strip</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Output</span>
                        <span className="text-slate-200">cleanstart-base:v3.2.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Source Artifact SHA-256 Digest</p>
                    <p className="text-xs text-emerald-400 font-mono break-all bg-slate-950/80 p-2.5 rounded border border-slate-800/60">
                      sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                  </div>
                </div>

                {/* Build Node B */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 p-5 font-mono">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Independent Auditor (B)
                      </span>
                      <span className="text-[11px] text-slate-500">arm64-darwin</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Source Commit</span>
                        <span className="text-slate-200">git: 8f9a2e1d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Compiler Flags</span>
                        <span className="text-slate-300">--hermetic --strip</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Output</span>
                        <span className="text-slate-200">cleanstart-base:v3.2.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Source Artifact SHA-256 Digest</p>
                    <p className="text-xs text-emerald-400 font-mono break-all bg-slate-950/80 p-2.5 rounded border border-slate-800/60">
                      sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Result Banner */}
              <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 text-center font-mono text-xs text-emerald-300">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-emerald-400">
                  <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>VERIFICATION PASSED: Digests match across independent infrastructure (0 byte variation)</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Prose paragraphs={REPRODUCIBLE.body} />

        {/* High-Impact Editorial Pull Quote */}
        <Reveal header className="my-8 py-8 border-y border-[#111111]/[0.11]">
          <p
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h3-ls)",
              lineHeight: 1.35,
              maxWidth: "36ch",
              textWrap: "balance",
            }}
          >
            "{REPRODUCIBLE.pull}"
          </p>
        </Reveal>

        <Prose paragraphs={[REPRODUCIBLE.close]} />
      </ArticleSection>
    </>
  );
}



