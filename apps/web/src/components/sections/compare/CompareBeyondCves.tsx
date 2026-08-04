import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { BEYOND_CVES } from "./compare-data";
import { ListLead, Prose, SectionHeading } from "./compare-editorial";
import {
  BAND_DARK,
  EllipseGlow,
  HexOutline,
  Icon3D,
} from "./compare-visuals";

/**
 * Security: More Than Reducing CVEs.
 *
 * Two movements, and the one place on the page where a light-to-dark break is
 * earned rather than decorative: the light half lists what hardening buys, then
 * the article turns — one question answered, five left open — and the dark band
 * carries that turn.
 */

const BENEFIT_ICONS: readonly string[] = [
  "/images/cleanstart-images/uvp-icon-smaller-images.webp",
  "/images/attack-surface-reduction/approach-icon-minimal.webp",
  "/images/for-developers/why/icon-remediation.webp",
  "/images/cleanstart-images/uvp-icon-memory.webp",
  "/images/cleanstart-images/uvp-icon-attack-surface.webp",
];

const COLUMN_TEXT: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  lineHeight: 1.6,
  letterSpacing: "-0.01em",
  maxWidth: "44ch",
};

export function CompareBeyondCves(): React.ReactElement {
  return (
    <>
      <Section
        data-section="CompareBeyondCves"
        padding="lg"
        className="relative overflow-hidden bg-white"
        aria-labelledby="compare-beyond-cves-title"
      >

        <Container className="relative flex flex-col gap-6 md:gap-7">
          <SectionHeading id="compare-beyond-cves-title">
            {BEYOND_CVES.heading}
          </SectionHeading>
          <Prose paragraphs={BEYOND_CVES.body} lead />
          <ListLead>{BEYOND_CVES.benefitsLead}</ListLead>

          <RevealStagger className="mt-2 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
            {BEYOND_CVES.benefits.map((benefit, index) => (
              <RevealItem key={benefit}>
                <div className="flex flex-col items-start gap-4">
                  <Icon3D
                    src={BENEFIT_ICONS[index] ?? BENEFIT_ICONS[0] ?? ""}
                    size={72}
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
                    {benefit}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </Container>
      </Section>

      {/* ── The turn ── */}
      <Section
        data-section="CompareBeyondCvesTurn"
        padding="lg"
        className="relative overflow-hidden"
        style={{ background: BAND_DARK }}
      >
        <HexOutline side="left" />
        <HexOutline side="right" />
        <EllipseGlow side="left" />

        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              <Reveal>
                <p className="text-white/70" style={COLUMN_TEXT}>
                  {BEYOND_CVES.pivot}
                </p>
              </Reveal>
              <Reveal header delay={0.08}>
                <p
                  className="mt-6 font-display text-white"
                  style={{
                    fontSize: "var(--fs-h2)",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.12,
                    maxWidth: "18ch",
                    textWrap: "balance",
                  }}
                >
                  {BEYOND_CVES.answered}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="mt-7 text-white/70" style={COLUMN_TEXT}>
                  {BEYOND_CVES.close}
                </p>
              </Reveal>
            </div>

            <div>
              <Reveal>
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
                  {BEYOND_CVES.unansweredLead}
                </p>
              </Reveal>

              <RevealStagger className="mt-6 flex flex-col">
                {BEYOND_CVES.unanswered.map((question, index) => (
                  <RevealItem key={question}>
                    <div
                      className="flex items-center gap-5 py-4"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.16)" }}
                    >
                      <span
                        aria-hidden
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full tabular-nums"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          boxShadow: "inset 0 0 0 1px rgba(201,166,255,0.45)",
                          color: "#C9A6FF",
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-caption)",
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        className="text-white/90"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-body)",
                          lineHeight: 1.45,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {question}
                      </span>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
