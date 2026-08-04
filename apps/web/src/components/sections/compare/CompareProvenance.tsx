import { Section, Container } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { BOMS, PROVENANCE } from "./compare-data";
import {
  ArticleSection,
  ListLead,
  Prose,
  SectionHeading,
} from "./compare-editorial";
import { Glow, Glyph, accentAt, type GlyphKey } from "./compare-visuals";

/**
 * Software Provenance · SBOMs and AI BOMs.
 *
 * Elevated visual designs:
 *  - 8 Provenance Fields: 4-column elevated card matrix with glowing line icon gems.
 *  - SLSA Level 3 vs Level 4 Comparison Deck: Side-by-side comparative cards.
 *  - BOMs: Stacked planes on dark band.
 *
 * No em-dashes, no cheap eyebrows or artificial tags.
 */

const PROVENANCE_ICONS: readonly GlyphKey[] = [
  "origin",
  "compiler",
  "surface",
  "build",
  "packages",
  "binary",
  "overhead",
  "seal",
];

export function CompareProvenance(): React.ReactElement {
  const fields = PROVENANCE.items;

  return (
    <>
      <ArticleSection label="compare-provenance-title" name="CompareProvenance">
        <SectionHeading id="compare-provenance-title">
          {PROVENANCE.heading}
        </SectionHeading>
        <Prose paragraphs={PROVENANCE.body} lead />
        <ListLead>{PROVENANCE.listLead}</ListLead>

        {/* 8-Stage Provenance Record Matrix */}
        <RevealStagger className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field, index) => {
            const accent = accentAt(index);
            return (
              <RevealItem key={field} className="h-full">
                <article
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    borderColor: accent.border,
                    background: `linear-gradient(180deg, ${accent.fill} 0%, #ffffff 60%)`,
                  }}
                >
                  <div className="mb-4">
                    <span
                      aria-hidden
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white transition-transform duration-300 group-hover:scale-110"
                      style={{
                        color: accent.light,
                        boxShadow: `0 6px 16px -6px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
                      }}
                    >
                      <Glyph icon={PROVENANCE_ICONS[index] ?? "check"} size={20} />
                    </span>
                  </div>

                  <p
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-body)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.35,
                    }}
                  >
                    {field}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </RevealStagger>

        {/* SLSA Level 3 vs SLSA Level 4 Comparison Cards */}
        {PROVENANCE.after && PROVENANCE.after.length >= 2 && (
          <RevealStagger className="my-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* DHI SLSA Level 3 Card */}
            <RevealItem className="h-full">
              <div className="relative flex h-full flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-white p-6 shadow-sm">
                <div>
                  <h3 className="mb-3 font-display text-base font-semibold text-[#111111]">
                    Docker Hardened Images
                  </h3>
                  <p
                    className="text-[#374151]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      lineHeight: 1.6,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {PROVENANCE.after[0]}
                  </p>
                </div>
              </div>
            </RevealItem>

            {/* CleanStart SLSA Level 4 Card */}
            <RevealItem className="h-full">
              <div
                className="relative flex h-full flex-col justify-between rounded-2xl border border-purple-300/80 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white p-6 shadow-md"
                style={{ boxShadow: "0 12px 32px -16px rgba(109, 40, 217, 0.22)" }}
              >
                <div>
                  <h3 className="mb-3 font-display text-base font-semibold text-[#111111]">
                    CleanStart
                  </h3>
                  <p
                    className="text-[#111111]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {PROVENANCE.after[1]}
                  </p>
                </div>
              </div>
            </RevealItem>
          </RevealStagger>
        )}

        {/* Concluding Paragraph */}
        {PROVENANCE.after?.[2] && (
          <Prose paragraphs={[PROVENANCE.after[2]]} />
        )}
      </ArticleSection>

      <Section
        data-section="CompareBoms"
        padding="lg"
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #151021 0%, #1B1240 100%)" }}
        aria-labelledby="compare-boms-title"
      >
        <Glow color="rgba(100,13,251,0.26)" size="min(660px, 44%)" left="-6%" bottom="-22%" />

        <Container className="relative">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <Reveal header>
                <h2
                  id="compare-boms-title"
                  className="font-display text-white"
                  style={{
                    fontSize: "var(--fs-h2)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    maxWidth: "22ch",
                    textWrap: "balance",
                  }}
                >
                  {BOMS.heading}
                </h2>
              </Reveal>
              <Reveal delay={0.08} className="mt-6 flex flex-col gap-4">
                {[...BOMS.body, ...(BOMS.after ?? [])].map((text) => (
                  <p
                    key={text}
                    className="max-w-[54ch] text-white/76"
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
            </div>

            <div className="flex flex-col gap-5">
              <Reveal delay={0.14}>
                <BomPlane
                  icon="aibom"
                  title="AI Bills of Materials (AI BOMs)"
                  lit
                />
              </Reveal>
              <Reveal delay={0.2}>
                <BomPlane
                  icon="sbom"
                  title="Software Bill of Materials (SBOM)"
                  lit={false}
                  items={BOMS.items ?? []}
                  itemsLead={BOMS.listLead}
                />
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function BomPlane({
  icon,
  title,
  lit,
  items,
  itemsLead,
}: {
  icon: "sbom" | "aibom";
  title: string;
  lit: boolean;
  items?: readonly string[] | undefined;
  itemsLead?: string | undefined;
}): React.ReactElement {
  const accent = accentAt(lit ? 0 : 1);
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: "22px",
        padding: "clamp(20px, 2vw, 30px)",
        background: lit
          ? "linear-gradient(140deg, rgba(169,116,255,0.24) 0%, rgba(44,193,235,0.12) 100%)"
          : "rgba(255,255,255,0.045)",
        border: lit
          ? "1px solid rgba(218,182,243,0.45)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: lit ? "0 28px 64px -38px rgba(122,61,240,0.8)" : "none",
      }}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-white"
          style={{
            background: lit
              ? `linear-gradient(145deg, color-mix(in srgb, ${accent.dark} 70%, #ffffff) 0%, ${accent.dark} 100%)`
              : "rgba(255,255,255,0.09)",
            boxShadow: lit
              ? `0 8px 18px -8px ${accent.dark}, inset 0 1.5px 1px rgba(255,255,255,0.6)`
              : "inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          <Glyph icon={icon} size={21} />
        </span>
        <p
          className="font-display text-white"
          style={{
            fontSize: "var(--fs-h5)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
      </div>

      {itemsLead && items && items.length > 0 && (
        <>
          <p
            className="mt-5 text-white/60"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body-sm)",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
            }}
          >
            {itemsLead}
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3"
                style={{ paddingTop: "7px", paddingBottom: "7px" }}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: accent.dark }}
                />
                <span
                  className="text-white/85"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body-sm)",
                    lineHeight: 1.4,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
