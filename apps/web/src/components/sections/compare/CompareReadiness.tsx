import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { COMPLIANCE, DEV_EXPERIENCE, VERIFYING } from "./compare-data";
import {
  ArticleSection,
  ListLead,
  Prose,
  RULE,
  SectionHeading,
} from "./compare-editorial";
import { Glyph, accentAt, type GlyphKey } from "./compare-visuals";

/**
 * Compliance and Regulatory Readiness · Developer Experience · Verifying
 * Container Images.
 *
 * Three list shapes, three treatments: six compliance capabilities as icon-disc
 * evidence chips, seven tool names as one rule-delimited rail on a tinted band
 * (they are labels, not statements), and seven verification questions as a
 * numbered chain — the article frames those as a sequence you work through.
 */

const EVIDENCE_ICONS: readonly GlyphKey[] = [
  "provenance",
  "signature",
  "sbom",
  "build",
  "fips",
  "stig",
];

const VERIFYING_ICONS: readonly GlyphKey[] = [
  "sbom",
  "signature",
  "provenance",
  "binary",
  "build",
  "origin",
  "seal",
];

export function CompareReadiness(): React.ReactElement {
  const questions = VERIFYING.items;

  return (
    <>
      <ArticleSection label="compare-compliance-title" name="CompareCompliance">
        <SectionHeading id="compare-compliance-title">
          {COMPLIANCE.heading}
        </SectionHeading>
        <Prose paragraphs={COMPLIANCE.body} lead />
        <ListLead>{COMPLIANCE.listLead}</ListLead>

        <RevealStagger className="my-6 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {(COMPLIANCE.items ?? []).map((item, index) => {
            const accent = accentAt(index);
            return (
              <RevealItem key={item}>
                <div
                  className="flex items-center gap-4"
                  style={{
                    borderTop: RULE,
                    paddingTop: "clamp(14px, 1.3vw, 18px)",
                    paddingBottom: "clamp(14px, 1.3vw, 18px)",
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white"
                    style={{
                      color: accent.light,
                      boxShadow: `0 6px 16px -8px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
                    }}
                  >
                    <Glyph icon={EVIDENCE_ICONS[index] ?? "check"} size={19} />
                  </span>
                  <span
                    className="text-[#111111]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      fontWeight: 500,
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item}
                  </span>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>

        <Prose paragraphs={COMPLIANCE.after ?? []} />
      </ArticleSection>

      <ArticleSection
        label="compare-dx-title"
        name="CompareDevExperience"
        className="!bg-[#f7f7f7]"
      >
        <SectionHeading id="compare-dx-title">{DEV_EXPERIENCE.heading}</SectionHeading>
        <Prose paragraphs={DEV_EXPERIENCE.body} lead />
        <ListLead>{DEV_EXPERIENCE.listLead}</ListLead>
        <Reveal>
          <ul
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
            style={{ borderTop: RULE, paddingTop: "clamp(18px, 1.7vw, 26px)" }}
          >
            {DEV_EXPERIENCE.items.map((tool, index) => (
              <li key={tool} className="flex items-center gap-5">
                {index > 0 && (
                  <span
                    aria-hidden
                    className="h-4 w-px"
                    style={{ background: "rgba(17,17,17,0.16)" }}
                  />
                )}
                <span
                  className="text-[#111111]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-lead-sm)",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tool}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Prose paragraphs={DEV_EXPERIENCE.after} />
      </ArticleSection>

      <ArticleSection label="compare-verifying-title" name="CompareVerifying">
        <SectionHeading id="compare-verifying-title">
          {VERIFYING.heading}
        </SectionHeading>
        <Prose paragraphs={VERIFYING.body} lead />
        <ListLead>{VERIFYING.listLead}</ListLead>

        {/* 7 Verification Criteria Cards */}
        <RevealStagger className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((question, index) => {
            const accent = accentAt(index);
            return (
              <RevealItem key={question} className="h-full">
                <article
                  className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    borderColor: accent.border,
                    background: `linear-gradient(180deg, ${accent.fill} 0%, #ffffff 60%)`,
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white transition-transform duration-300 group-hover:scale-110"
                    style={{
                      color: accent.light,
                      boxShadow: `0 6px 16px -6px ${accent.shadow}, inset 0 0 0 1px ${accent.border}`,
                    }}
                  >
                    <Glyph icon={VERIFYING_ICONS[index] ?? "check"} size={20} />
                  </span>

                  <p
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-body)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.4,
                    }}
                  >
                    {question}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </RevealStagger>

        <Prose paragraphs={VERIFYING.after} />
      </ArticleSection>
    </>
  );
}
