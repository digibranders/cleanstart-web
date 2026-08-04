import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { HERMETIC, REPRODUCIBLE, SOURCE_BUILT } from "./compare-data";
import { ListLead, P, Prose, SectionHeading } from "./compare-editorial";
import {
  CornerTile,
  Icon3D,
  RULE_LIGHT,
  cornerAt,
} from "./compare-visuals";

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
                <CornerTile corner={cornerAt(index)}>
                  <Icon3D
                    src={SOURCE_ICONS[index] ?? SOURCE_ICONS[0] ?? ""}
                    size={68}
                  />
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
                    {item}
                  </p>
                </CornerTile>
              </RevealItem>
            ))}
          </RevealStagger>

          <Prose paragraphs={SOURCE_BUILT.after ?? []} />
        </div>

        {/* ── Hermetic and Deterministic Builds ── */}
        <div
          className="flex flex-col gap-6 md:gap-7"
          style={{ borderTop: RULE_LIGHT, paddingTop: "clamp(40px, 3.6vw, 64px)" }}
        >
          <SectionHeading id="compare-hermetic-title">
            {HERMETIC.heading}
          </SectionHeading>
          <Prose paragraphs={HERMETIC.body} lead />

          {/* The four prohibitions are the one list on this page that is a set
              of negatives, so they are struck rather than ticked. */}
          <Reveal>
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: "24px",
                background:
                  "linear-gradient(150deg, #F7F5FF 0%, #FFFFFF 55%, #F4F0FF 100%)",
                border: "1.5px solid rgba(0,0,0,0.06)",
                padding: "clamp(22px, 2.2vw, 36px)",
              }}
            >
              <p
                className="text-[#111111]"
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
                      borderTop: RULE_LIGHT,
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
                        color: "#6B6B6B",
                        textDecoration: "line-through",
                        textDecorationColor: "rgba(17,17,17,0.28)",
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Prose paragraphs={HERMETIC.after ?? []} />
        </div>

        {/* ── Reproducible Builds ── */}
        <div
          className="flex flex-col gap-6 md:gap-7"
          style={{ borderTop: RULE_LIGHT, paddingTop: "clamp(40px, 3.6vw, 64px)" }}
        >
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

            {/* The article's own one-line thesis for this section, given the
                weight of a statement rather than another paragraph. */}
            <Reveal className="lg:pt-2">
              <div
                className="relative flex h-full flex-col justify-center overflow-hidden"
                style={{
                  borderRadius: "24px",
                  background:
                    "linear-gradient(150deg, #241A4D 0%, #2E2270 48%, #4A25B8 100%)",
                  padding: "clamp(26px, 2.6vw, 44px)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute select-none rounded-full"
                  style={{
                    right: "-18%",
                    top: "-26%",
                    width: "62%",
                    aspectRatio: "1 / 1",
                    background:
                      "radial-gradient(closest-side, rgba(169,116,255,0.55), transparent 72%)",
                  }}
                />
                <p
                  className="relative font-display text-white"
                  style={{
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h3-ls)",
                    lineHeight: 1.28,
                    textWrap: "balance",
                  }}
                >
                  {REPRODUCIBLE.pull}
                </p>
                <p
                  className="relative mt-5 text-white/72"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    lineHeight: 1.6,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {REPRODUCIBLE.close}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
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
        stroke="rgba(17,17,17,0.32)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
