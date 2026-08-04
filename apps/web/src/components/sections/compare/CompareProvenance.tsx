import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { BOMS, PROVENANCE } from "./compare-data";
import { ListLead, P, Prose, SectionHeading } from "./compare-editorial";
import {
  AssuranceCard,
  Icon3D,
  RULE_LIGHT,
  WASH_LIGHT,
} from "./compare-visuals";

/**
 * Software Provenance · SBOMs and AI BOMs — two movements in one band.
 *
 * Designed with 100% crisp vector SVG icons inside micro-containers, giving
 * each provenance field clean visual identity across all viewports without
 * broken backgrounds or image scaling issues.
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

          <RevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROVENANCE.items.map((field, index) => (
              <RevealItem key={field} className="h-full">
                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#6A3DF0]/35 hover:-translate-y-0.5 transition-all duration-200 min-h-[110px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-[#6A3DF0] border border-purple-100/80 group-hover:bg-[#6A3DF0] group-hover:text-white transition-colors duration-200">
                      <ProvenanceIcon index={index} />
                    </div>
                    <span
                      aria-hidden
                      className="tabular-nums text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-500 border border-slate-200/50 group-hover:bg-purple-100/60 group-hover:text-[#6A3DF0] transition-colors duration-200"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-h5)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                      textWrap: "balance",
                    }}
                  >
                    {field}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          {/* The document's own SLSA contrast, given equal weight per side. */}
          <RevealStagger className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              { name: "Docker Hardened Images", text: PROVENANCE.after[0] },
              { name: "CleanStart", text: PROVENANCE.after[1] },
            ].map((side, index) => (
              <RevealItem key={side.name} className="h-full">
                <div
                  className="relative flex h-full flex-col overflow-hidden"
                  style={{
                    borderRadius: "24px",
                    background: index === 1 ? "#F7F3FF" : "#FFFFFF",
                    border:
                      index === 1
                        ? "1.5px solid rgba(138,92,246,0.28)"
                        : "1.5px solid rgba(0,0,0,0.07)",
                    padding: "clamp(22px, 2.1vw, 34px)",
                  }}
                >
                  <p
                    className="font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-h5)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                      marginBottom: "12px",
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

          <RevealStagger className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RevealItem className="h-full">
              <AssuranceCard className="h-full">
                <Icon3D src="/images/compare/icon-sbom.webp" size={80} className="mb-5" />
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
              </AssuranceCard>
            </RevealItem>

            <RevealItem className="h-full">
              <AssuranceCard className="h-full">
                <Icon3D src="/images/compare/icon-ai-bom.webp" size={80} className="mb-5" />
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
              </AssuranceCard>
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

function ProvenanceIcon({ index }: { index: number }): React.ReactElement {
  const icons = [
    // 01 Source repository - Git Branch
    <svg key="01" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>,
    // 02 Commit identifier - Git Commit Node
    <svg key="02" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22.95" y2="12" />
    </svg>,
    // 03 Builder identity - Verified Shield
    <svg key="03" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>,
    // 04 Build workflow - CI/CD Pipeline Nodes
    <svg key="04" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="6" height="6" rx="1" />
      <rect x="16" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M5 9v3a2 2 0 0 0 2 2h2" />
      <path d="M19 9v3a2 2 0 0 1-2 2h-2" />
    </svg>,
    // 05 Dependency information - Package Tree
    <svg key="05" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>,
    // 06 Artifact digest - Cryptographic Hash Fingerprint
    <svg key="06" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>,
    // 07 Timestamps - Immutable Clock
    <svg key="07" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>,
    // 08 Cryptographic attestations - Signature Seal / Key
    <svg key="08" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 15 2 2 4-4" />
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>,
  ];

  return icons[index % icons.length] ?? (icons[0] as React.ReactElement);
}
