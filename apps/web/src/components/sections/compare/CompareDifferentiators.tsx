import { Section, Container } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import type { DifferentiatorsSection } from "./compare-types";
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
 * "Where CleanStart Differentiates" and its sub-headings.
 *
 * These are the document's only H2s, so they are the page's only H3s. Laid
 * out the way the site's "Why It Matters" bands are: three open columns split
 * by gradient hairlines, each led by a large violet 3D icon on the purple
 * bloom, then a bold H3 and its sentence. No tiles: this is the page's thesis
 * band, and the icons need room to carry it. Three columns need `lg` to hold
 * a readable measure; below it they stack.
 */
export function CompareDifferentiators({
  content,
}: {
  content: DifferentiatorsSection;
}): React.ReactElement {
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
              <AccentHeading text={content.heading} />
            </h2>
          </Reveal>
        </div>

        <RevealStagger className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-3 lg:gap-0">
          {content.items.map((item, index) => (
            <RevealItem
              key={item.id}
              className="relative flex flex-col lg:px-[clamp(20px,2.5vw,40px)] lg:first:pl-0 lg:last:pr-0"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 hidden w-px lg:block"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)",
                  }}
                />
              )}

              <Icon3D src={item.icon} size={124} />

              <h3
                /* The measures are sized for the three-column desktop layout;
                   below lg the column is the full width and a 20ch cap just
                   leaves half the band empty. */
                /* Two lines, always. With three columns side by side, a
                   heading that fits on one pulled its paragraph up level with
                   its neighbours' second line.
                   18ch is measured, not guessed: across the Docker, Red Hat and
                   Chainguard headings every one sets to exactly two lines
                   anywhere from 17.5ch to 19ch. Above 19ch the shortest
                   ("Discover. Remediate. Verify.") collapses to one line; at
                   17ch the longest ("Verified Software Across the Supply
                   Chain") spills to three. 18ch sits a full 1ch clear of both.
                   `min-h` stays as the backstop for a future heading short
                   enough to fit on one line anyway.
                   The floor alone is what aligns the paragraphs, and it needs
                   no maintenance; the `max-w` exists only because the brief
                   was that every heading SET to two lines, which needs the
                   wrap forced. So re-sweep the band when a comparison is
                   added: count real line boxes (Range#getClientRects), never
                   height / line-height, which this `min-h` makes lie. */
                className="mt-6 font-display text-[#111111] lg:min-h-[2lh] lg:max-w-[18ch]"
                style={{
                  fontSize: "var(--fs-h3)",
                  fontWeight: "var(--fs-h3-weight)",
                  letterSpacing: "var(--fs-h3-ls)",
                  lineHeight: "var(--fs-h3-lh)",
                }}
              >
                {unbreakable(item.heading)}
              </h3>

              <p
                className="mt-4 max-w-[62ch] lg:max-w-[36ch]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: "var(--fs-body-lh)",
                  letterSpacing: "var(--fs-body-ls)",
                  color: "#333333",
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
