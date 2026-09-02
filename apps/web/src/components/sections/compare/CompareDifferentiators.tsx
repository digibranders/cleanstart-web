import { Section, Container } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { DIFFERENTIATORS } from "./compare-data";
import { CornerTile, cornerAt, Icon3D, WASH_LIGHT } from "./compare-visuals";

/**
 * "Where CleanStart Differentiates" and its three sub-headings.
 *
 * These are the document's only H2s, so they are the page's only H3s. Three
 * `SbomAdvantage` corner tiles carrying the violet 3D icon set already in
 * `public/images/compare`; the oversized corner rotates across the row, which
 * is the rhythm the site gets out of that tile rather than a colour rotation.
 */
export function CompareDifferentiators(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="CompareDifferentiators"
      className="overflow-hidden"
      style={{ background: WASH_LIGHT }}
    >
      <Container className="relative">
        <div className="max-w-[720px]">
          <Reveal header>
            <h2
              id="where-cleanstart-differentiates"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              {DIFFERENTIATORS.heading}
            </h2>
          </Reveal>
        </div>

        <RevealStagger className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {DIFFERENTIATORS.items.map((item, index) => (
            <RevealItem key={item.id} className="h-full">
              <CornerTile corner={cornerAt(index)} className="gap-0">
                <Icon3D src={item.icon} size={68} />

                <h3
                  className="mt-5 font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: 600,
                    letterSpacing: "var(--fs-h4-ls)",
                    lineHeight: "var(--fs-h4-lh)",
                  }}
                >
                  {item.heading}
                </h3>

                <p
                  className="mt-3"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    lineHeight: "var(--fs-body-lh)",
                    color: "rgba(17,17,17,0.66)",
                  }}
                >
                  {item.body}
                </p>
              </CornerTile>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
