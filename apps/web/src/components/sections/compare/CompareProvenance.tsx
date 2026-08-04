import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { ProvenanceRecord } from "./compare-artifacts";
import { BOMS, PROVENANCE } from "./compare-data";
import { ListLead, P, Prose, SectionHeading } from "./compare-editorial";
import { Icon3D, RULE_LIGHT, WASH_LIGHT } from "./compare-visuals";

/**
 * Software Provenance · SBOMs and AI BOMs — two movements in one band.
 *
 * Neither movement uses a card grid. Provenance is shown as the record itself,
 * and the two bill-of-materials concepts are a rule-split pair. In both cases
 * the box was decorating the content rather than clarifying it.
 */

export function CompareProvenance(): React.ReactElement {
  return (
    <Section
      data-section="CompareProvenance"
      padding="lg"
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(246,246,246,0) 0%, ${WASH_LIGHT} 110px, ${WASH_LIGHT} calc(100% - 110px), rgba(246,246,246,0) 100%)`,
      }}
      aria-labelledby="compare-provenance-title"
    >
      <Container className="relative flex flex-col gap-[clamp(56px,5vw,88px)]">
        {/* ── Software Provenance ── */}
        <div className="flex flex-col gap-6 md:gap-7">
          <SectionHeading id="compare-provenance-title">
            {PROVENANCE.heading}
          </SectionHeading>
          <Prose paragraphs={PROVENANCE.body} lead />
          <ListLead>{PROVENANCE.listLead}</ListLead>

          {/*
           * The eight fields are the record's own keys, not eight tiles beside
           * it. A provenance record is one document; setting it as one document
           * says more than a grid of cards repeating its field names — and it
           * turns this section's weakest block into the page's best visual.
           */}
          <Reveal>
            <ProvenanceRecord fields={PROVENANCE.items} />
          </Reveal>

          {/* The document's own SLSA contrast, given equal weight per side. */}
          <RevealStagger className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              { name: "Docker Hardened Images", text: PROVENANCE.after[0] },
              { name: "CleanStart", text: PROVENANCE.after[1] },
            ].map((side, index) => (
              <RevealItem key={side.name} className="h-full">
                {/* A weighted rule, not a card. Two short paragraphs
                    contrasting two vendors need separating, not enclosing. */}
                <div
                  className="flex h-full flex-col"
                  style={{
                    borderTop: `2px solid ${
                      index === 1 ? "#8B5CF6" : "rgba(17,17,17,0.18)"
                    }`,
                    paddingTop: "clamp(14px, 1.3vw, 20px)",
                  }}
                >
                  <p
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-h5)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                      marginBottom: "10px",
                    }}
                  >
                    {side.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      lineHeight: 1.6,
                      letterSpacing: "-0.01em",
                      color: index === 1 ? "#241A4D" : "#4A4A4A",
                      fontWeight: index === 1 ? 500 : 400,
                    }}
                  >
                    {side.text}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal>
            <P>{PROVENANCE.after[2]}</P>
          </Reveal>
        </div>

        {/* ── SBOMs and AI BOMs ── */}
        <div
          className="flex flex-col gap-6 md:gap-7"
          style={{ borderTop: RULE_LIGHT, paddingTop: "clamp(40px, 3.6vw, 64px)" }}
        >
          <SectionHeading id="compare-boms-title">{BOMS.heading}</SectionHeading>
          <Prose paragraphs={BOMS.body} lead />

          {/*
           * A progression, not a 50/50 split. The copy is explicit that AI BOMs
           * *extend* SBOMs, so the layout says so: the established artifact,
           * a connector, then CleanStart's extension carrying the brand tint.
           * The previous symmetric pair also read as lopsided, because one side
           * is a capability list and the other is prose — they were never the
           * same shape of content.
           */}
          <RevealStagger className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0">
            <RevealItem className="h-full">
              <article
                className="relative flex h-full flex-col overflow-hidden bg-white"
                style={{
                  borderRadius: "24px",
                  border: "1px solid rgba(17,17,17,0.09)",
                  boxShadow: "0 1px 2px rgba(17,17,17,0.04)",
                  padding: "clamp(24px, 2.2vw, 36px)",
                }}
              >
                <Icon3D src="/images/compare/icon-sbom.webp" size={104} className="mb-5" />
                <p
                  className="font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h4-ls)",
                    lineHeight: 1.2,
                  }}
                >
                  Software Bill of Materials
                </p>
                <p
                  className="mt-3 text-[#4A4A4A]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {BOMS.listLead}
                </p>
                <ul className="mt-3 flex flex-col">
                  {(BOMS.items ?? []).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 py-2.5"
                      style={{ borderTop: RULE_LIGHT }}
                    >
                      <Tick />
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-body-sm)",
                          lineHeight: 1.45,
                          letterSpacing: "-0.01em",
                          color: "#222222",
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </RevealItem>

            {/* The connector. Points right between the two cards, down when
                they stack, so the direction of the relationship survives at
                every width. */}
            <div
              aria-hidden
              className="pointer-events-none relative flex select-none items-center justify-center py-1 lg:px-7 lg:py-0"
            >
              <span
                className="absolute bg-[#111111]/[0.10] max-lg:inset-x-0 max-lg:top-1/2 max-lg:h-px lg:inset-y-0 lg:left-1/2 lg:w-px"
              />
              <span
                className="relative inline-flex items-center justify-center rounded-full bg-white"
                style={{
                  width: "40px",
                  height: "40px",
                  boxShadow:
                    "inset 0 0 0 1px rgba(138,92,246,0.35), 0 6px 16px -8px rgba(70,30,190,0.28)",
                  color: "#6A3DF0",
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="max-lg:rotate-90"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            <RevealItem className="h-full">
              <article
                className="relative flex h-full flex-col overflow-hidden"
                style={{
                  borderRadius: "24px",
                  border: "1.5px solid rgba(138,92,246,0.30)",
                  background:
                    "linear-gradient(150deg, #ffffff 0%, #ffffff 30%, #F4ECFF 76%, #E9DBFF 100%)",
                  boxShadow:
                    "0 1px 2px rgba(17,17,17,0.04), 0 18px 44px -26px rgba(70,30,190,0.28)",
                  padding: "clamp(24px, 2.2vw, 36px)",
                }}
              >
                <Icon3D src="/images/compare/icon-ai-bom.webp" size={104} className="mb-5" />
                <p
                  className="font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h4-ls)",
                    lineHeight: 1.2,
                  }}
                >
                  AI Bill of Materials
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  {(BOMS.after ?? []).map((text) => (
                    <p
                      key={text}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body-sm)",
                        lineHeight: 1.55,
                        letterSpacing: "-0.01em",
                        color: "#4A4A4A",
                      }}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </article>
            </RevealItem>
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}

function Tick(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      className="mt-[3px] shrink-0"
    >
      <path
        d="M2.5 8L5.5 11L12.5 4"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

