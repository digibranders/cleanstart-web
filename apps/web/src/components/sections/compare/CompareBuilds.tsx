import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { ReproducibleBuildProof } from "./compare-artifacts";
import { HERMETIC, REPRODUCIBLE, SOURCE_BUILT } from "./compare-data";
import { ListLead, P, Prose, SectionHeading } from "./compare-editorial";
import { BAND_DARK, Icon3D, VectorGrid } from "./compare-visuals";

/**
 * Building from Source · Hermetic and Deterministic Builds · Reproducible
 * Builds — the article's three build-assurance sections, set as three movements
 * inside ONE band instead of three stacked slabs.
 *
 * Every heading stays an H2 with the document's own wording. The consolidation
 * here is visual: one background, one decoration pass, hairline rules between
 * movements. Demoting these to H3 would have needed an invented parent heading,
 * which the copy document does not supply.
 */

const SOURCE_ICONS: readonly string[] = [
  "/images/compare/icon-origin.webp",
  "/images/for-developers/why/icon-development.webp",
  "/images/compare/icon-provenance.webp",
  "/images/sbom/risk-icon-incomplete.webp",
];

export function CompareBuilds(): React.ReactElement {
  return (
    <>
    <Section
      data-section="CompareBuilds"
      padding="lg"
      className="relative overflow-hidden bg-white"
      aria-labelledby="compare-source-title"
    >
      <Container className="relative flex flex-col gap-[clamp(56px,5vw,88px)]">
        {/* ── Building from Source ── */}
        <div className="flex flex-col gap-6 md:gap-7">
          <SectionHeading id="compare-source-title">
            {SOURCE_BUILT.heading}
          </SectionHeading>
          <Prose paragraphs={SOURCE_BUILT.body} lead />
          <ListLead>{SOURCE_BUILT.listLead}</ListLead>

          <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(SOURCE_BUILT.items ?? []).map((item, index) => (
              <RevealItem key={item} className="h-full">
                {/*
                 * Four discrete capabilities, so four cards — separate boxes
                 * here rather than the single divided panel the opening
                 * questions use, which keeps the two light sections from
                 * reading as the same layout twice.
                 */}
                <div
                  className="relative flex h-full flex-col items-center overflow-hidden bg-white text-center"
                  style={{
                    borderRadius: "24px",
                    border: "1px solid rgba(17,17,17,0.08)",
                    boxShadow:
                      "0 1px 2px rgba(17,17,17,0.04), 0 16px 40px -26px rgba(70,30,190,0.20)",
                    padding: "clamp(28px, 2.4vw, 40px) clamp(20px, 1.8vw, 28px)",
                    gap: "clamp(18px, 1.6vw, 24px)",
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 select-none"
                    style={{
                      background:
                        "radial-gradient(115% 90% at 50% 0%, #F6F1FF 0%, rgba(255,255,255,0) 66%)",
                    }}
                  />
                  <Icon3D
                    src={SOURCE_ICONS[index] ?? SOURCE_ICONS[0] ?? ""}
                    size={128}
                    className="relative"
                  />
                  <p
                    className="relative font-display text-[#111111]"
                    style={{
                      fontSize: "var(--fs-h5)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                      textWrap: "balance",
                    }}
                  >
                    {item}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          <Prose paragraphs={SOURCE_BUILT.after ?? []} />
        </div>
      </Container>
    </Section>

    {/*
     * ── Hermetic and Deterministic Builds ──
     *
     * Its own dark band, for two reasons. Structurally, the five movements from
     * "Building from Source" to "SBOMs and AI BOMs" ran to 4,287px of unbroken
     * light — #F6F6F6 against #FFFFFF is not a perceptible change, so it read
     * as one slab. Conceptually, this is the section about a sealed environment
     * that cannot reach outside itself, and the inversion is the enclosure.
     */}
    <Section
      data-section="CompareHermetic"
      padding="lg"
      className="relative overflow-hidden"
      style={{ background: BAND_DARK }}
      aria-labelledby="compare-hermetic-title"
    >
      {/* Bottom-right, and well off the edge. The prohibitions panel runs the
          full container width, so a plate at the default bleed sat underneath
          it; this one is pushed out until it clears the panel entirely. */}
      <VectorGrid
        side="right"
        bottom="-26%"
        edge="-22%"
        width="clamp(420px, 34vw, 640px)"
        opacity={0.42}
      />
      <Container className="relative">
        <div className="flex flex-col gap-6 md:gap-7">
          <SectionHeading id="compare-hermetic-title" inverse>
            {HERMETIC.heading}
          </SectionHeading>
          <Prose paragraphs={HERMETIC.body} lead inverse />

          {/* The four prohibitions are the one list on this page that is a set
              of negatives, so they are struck rather than ticked. */}
          <Reveal>
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: "24px",
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "clamp(22px, 2.2vw, 36px)",
              }}
            >
              <p
                className="text-white"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  letterSpacing: "-0.01em",
                }}
              >
                {HERMETIC.listLead}
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                {(HERMETIC.items ?? []).map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.14)",
                      paddingTop: "clamp(10px, 0.9vw, 14px)",
                      paddingBottom: "clamp(10px, 0.9vw, 14px)",
                    }}
                  >
                    <Cross />
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body)",
                        lineHeight: 1.45,
                        letterSpacing: "-0.01em",
                        color: "rgba(255,255,255,0.55)",
                        textDecoration: "line-through",
                        textDecorationColor: "rgba(255,255,255,0.38)",
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Prose paragraphs={HERMETIC.after ?? []} inverse />
        </div>
      </Container>
    </Section>

    {/* ── Reproducible Builds ── */}
    <Section
      data-section="CompareReproducible"
      padding="lg"
      className="relative overflow-hidden bg-white"
      aria-labelledby="compare-reproducible-title"
    >
      <Container className="relative">
        <div className="flex flex-col gap-6 md:gap-7">
          <SectionHeading id="compare-reproducible-title">
            {REPRODUCIBLE.heading}
          </SectionHeading>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div className="flex flex-col gap-6">
              <P lead>{REPRODUCIBLE.lead}</P>
              <Reveal header>
                <p
                  className="font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h3-ls)",
                    lineHeight: 1.3,
                    maxWidth: "26ch",
                    textWrap: "balance",
                  }}
                >
                  {REPRODUCIBLE.question}
                </p>
              </Reveal>
              <Prose paragraphs={REPRODUCIBLE.body} />
            </div>

            {/*
             * The section asks a question, so this answers it rather than
             * restating it: two builds that agree on nothing — different
             * builder, different day, different machine — and produce the same
             * digest. That is what "reproducible" means, shown instead of
             * asserted.
             */}
            <Reveal className="lg:pt-2">
              <ReproducibleBuildProof />
            </Reveal>
          </div>

          {/* The article's own one-line thesis, at display scale on the band.
              It carried a dark card before; the size alone is enough. */}
          <Reveal header className="mt-2">
            <p
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: 1.15,
                maxWidth: "20ch",
                textWrap: "balance",
              }}
            >
              {REPRODUCIBLE.pull}
            </p>
          </Reveal>
          <P>{REPRODUCIBLE.close}</P>
        </div>
      </Container>
    </Section>
    </>
  );
}

function Cross(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      className="mt-[5px] shrink-0"
    >
      <path
        d="M4 4l7 7M11 4l-7 7"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
