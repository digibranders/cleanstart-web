import { Section, Container } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { BOMS, PROVENANCE } from "./compare-data";
import {
  ArticleSection,
  ListLead,
  Prose,
  SectionHeading,
} from "./compare-editorial";
import { ChainStep, Glow, Glyph, accentAt } from "./compare-visuals";

/**
 * Software Provenance · SBOMs and AI BOMs.
 *
 * Provenance: the eight record fields as two numbered chains — a provenance
 * record is an ordered account of how something was produced, so a chain reads
 * it correctly where a grid of tiles would not. Previously this was a mock
 * terminal with invented repository paths and SHA digests; nothing here is
 * fabricated.
 *
 * BOMs: two stacked planes on a dark band. An AI BOM extends the SBOM layer
 * rather than competing with it, so the shared plane sits underneath and the
 * CleanStart-only plane is lifted and lit above it.
 */
export function CompareProvenance(): React.ReactElement {
  const fields = PROVENANCE.items;
  const firstHalf = fields.slice(0, 4);
  const secondHalf = fields.slice(4);

  return (
    <>
      <ArticleSection label="compare-provenance-title" name="CompareProvenance">
        <SectionHeading id="compare-provenance-title">
          {PROVENANCE.heading}
        </SectionHeading>
        <Prose paragraphs={PROVENANCE.body} lead />
        <ListLead>{PROVENANCE.listLead}</ListLead>

        <div className="mt-2 grid grid-cols-1 gap-x-16 gap-y-0 sm:grid-cols-2">
          <RevealStagger>
            <ol className="flex flex-col">
              {firstHalf.map((field, index) => (
                <RevealItem key={field}>
                  <ChainStep
                    index={index + 1}
                    accent={accentAt(index)}
                    label={field}
                    last={index === firstHalf.length - 1}
                  />
                </RevealItem>
              ))}
            </ol>
          </RevealStagger>
          <RevealStagger>
            <ol className="flex flex-col">
              {secondHalf.map((field, index) => (
                <RevealItem key={field}>
                  <ChainStep
                    index={index + 5}
                    accent={accentAt(index)}
                    label={field}
                    last={index === secondHalf.length - 1}
                  />
                </RevealItem>
              ))}
            </ol>
          </RevealStagger>
        </div>

        <Prose paragraphs={PROVENANCE.after} />
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
