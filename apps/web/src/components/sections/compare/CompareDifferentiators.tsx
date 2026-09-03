import { Section, Container } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { DIFFERENTIATORS } from "./compare-data";
import { AccentHeading, EnterpriseUnions, Icon3D, WASH_LAVENDER } from "./compare-visuals";

/**
 * Keep a hyphenated compound ("Source-to-Artifact") on one line. Balanced
 * wrapping otherwise breaks it at the hyphen, which reads as a typo.
 */
function unbreakable(heading: string): React.ReactNode {
  return heading.split(" ").map((word, i) => (
    <span key={`${word}-${i}`}>
      {i > 0 ? " " : null}
      {word.includes("-") ? <span className="whitespace-nowrap">{word}</span> : word}
    </span>
  ));
}

/**
 * "Where CleanStart Differentiates" and its three sub-headings.
 *
 * These are the document's only H2s, so they are the page's only H3s. Laid
 * out the way the site's "Why It Matters" bands are: three open columns split
 * by gradient hairlines, each led by a large violet 3D icon on the purple
 * bloom, then a bold H3 and its sentence. No tiles: this is the page's thesis
 * band, and the icons need room to carry it.
 */
export function CompareDifferentiators(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="CompareDifferentiators"
      className="overflow-hidden"
      style={{ background: WASH_LAVENDER }}
    >
      <EnterpriseUnions />

      <Container className="relative">
        <div className="max-w-[720px]">
          <Reveal header>
            <h2
              id="where-cleanstart-differentiates"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: "var(--fs-h2-weight)",
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              <AccentHeading text={DIFFERENTIATORS.heading} />
            </h2>
          </Reveal>
        </div>

        <RevealStagger className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0 lg:mt-16">
          {DIFFERENTIATORS.items.map((item, index) => (
            <RevealItem
              key={item.id}
              className="relative flex flex-col md:px-[clamp(20px,2.5vw,40px)] md:first:pl-0 md:last:pr-0"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 hidden w-px md:block"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)",
                  }}
                />
              )}

              <Icon3D src={item.icon} size={124} />

              <h3
                className="mt-6 font-display text-[#111111]"
                style={{
                  fontSize: "var(--fs-h3)",
                  fontWeight: "var(--fs-h3-weight)",
                  letterSpacing: "var(--fs-h3-ls)",
                  lineHeight: "var(--fs-h3-lh)",
                  maxWidth: "20ch",
                }}
              >
                {unbreakable(item.heading)}
              </h3>

              <p
                className="mt-4"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: "var(--fs-body-lh)",
                  letterSpacing: "var(--fs-body-ls)",
                  color: "#333333",
                  maxWidth: "36ch",
                }}
              >
                {item.body}
              </p>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
