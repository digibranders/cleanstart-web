import { Section, Container } from "@/components/layout";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { UI, type FoundationColumn, type FoundationsSection, type CompareTone } from "./compare-types";
import { BandHeader, BRAND, LightBandDecor, WASH_LIGHT } from "./compare-visuals";

/**
 * The document's opening band: the two approaches, side by side.
 *
 * Two columns on the wash, split by the site's gradient hairline with a "vs"
 * marker at its midpoint: the hero has just drawn the two stacks side by side,
 * and this band keeps that axis, the rival on the left and CleanStart on the
 * right.
 *
 * Both columns carry a faint field of their own, violet for ours and neutral
 * for theirs, at the same weight and inside the same padding. Only ours used
 * to have one, which left the rival's text reading as flush to the container
 * gutter while ours sat inside a visible card, and on the one band whose whole
 * subject is the two approaches side by side that put the comparison's own
 * axis out of true. Same structure, same type scale, same bullet count, same
 * shape. The tint and the violet markers are what say whose column is whose.
 *
 * The two "focuses on" lead-ins are always `<p>`: no source document sets them
 * as headings, and promoting them would add an outline level SEO never wrote.
 * The vendor names follow the document — `<p>` by default, `<h3>` where the
 * document sets them as headings (`labelAsHeading`). The Docker document does
 * not; the Chainguard one does.
 */

function Marker({ tone }: { tone: CompareTone }): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <span
      aria-hidden
      className="mt-[3px] inline-flex size-[20px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: isCleanStart
          ? `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.blue})`
          : BRAND.slate,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.2 4.8 8.5 9.5 3.8"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Column({
  column,
  asHeading,
}: {
  column: FoundationColumn;
  /** The vendor name is a heading in the source document, not a label. */
  asHeading: boolean;
}): React.ReactElement {
  const tone = column.id;
  const isCleanStart = tone === "cleanstart";
  const Label = asHeading ? "h3" : "p";
  return (
    <article
      className="relative flex h-full flex-col"
      style={{
        borderRadius: "24px",
        padding: "clamp(22px, 2vw, 34px)",
        /* Both columns carry a surface, and the same one at the same weight:
           violet for our side, neutral for theirs. They always had identical
           padding, but only one had a fill, so the rival's text read as flush
           to the container gutter while ours sat 24px inside a visible card.
           On the band this section is about, that put the comparison's own
           axis out of true. The tint and the violet markers are what say
           whose column is whose; the shape should not. */
        background: isCleanStart
          ? "linear-gradient(180deg, rgba(106,61,240,0.085) 0%, rgba(106,61,240,0.025) 100%)"
          : "linear-gradient(180deg, rgba(17,17,17,0.04) 0%, rgba(17,17,17,0.012) 100%)",
      }}
    >

      <Label
        className="font-display text-[#111111]"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: "var(--fs-h3-weight)",
          letterSpacing: "var(--fs-h3-ls)",
          lineHeight: "var(--fs-h3-lh)",
        }}
      >
        {column.label}
      </Label>

      <p
        className="mt-4"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          lineHeight: "var(--fs-body-lh)",
          letterSpacing: "var(--fs-body-ls)",
          color: "#333333",
          maxWidth: "46ch",
        }}
      >
        {column.body}
      </p>

      <p
        className="mt-8 font-display"
        style={{
          fontSize: "var(--fs-eyebrow)",
          fontWeight: "var(--fs-eyebrow-weight)",
          letterSpacing: "var(--fs-eyebrow-ls)",
          lineHeight: "var(--fs-eyebrow-lh)",
          textTransform: "uppercase",
          color: isCleanStart ? BRAND.violet : "rgba(51,65,85,0.75)",
        }}
      >
        {column.focusLabel}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {column.focus.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Marker tone={tone} />
            <span
              className="font-display"
              style={{
                fontSize: "var(--fs-h5)",
                fontWeight: 500,
                letterSpacing: "var(--fs-h5-ls)",
                lineHeight: "var(--fs-h5-lh)",
                color: "#111111",
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Divider(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative flex h-full items-center justify-center lg:flex-col"
      style={{ minHeight: "56px" }}
    >
      <span
        className="absolute inset-x-0 top-1/2 h-px lg:inset-x-auto lg:inset-y-0 lg:left-1/2 lg:top-auto lg:h-auto lg:w-px"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)",
        }}
      />
      <span
        className="absolute inset-y-0 left-1/2 hidden w-px lg:block"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)",
        }}
      />
      <span
        className="relative inline-flex size-12 items-center justify-center rounded-full bg-white font-display"
        style={{
          border: "1.5px solid rgba(0,0,0,0.06)",
          boxShadow: "0 8px 24px -14px rgba(17,17,17,0.35)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "var(--fs-badge-ls)",
          textTransform: "uppercase",
          color: BRAND.violet,
        }}
      >
        {UI.versus}
      </span>
    </div>
  );
}

export function CompareFoundations({
  content,
}: {
  content: FoundationsSection;
}): React.ReactElement {
  const [rival, cleanstart] = content.columns;
  const asHeading = content.labelAsHeading ?? false;

  return (
    <Section
      padding="md"
      data-section="CompareFoundations"
      className="overflow-hidden"
      style={{ background: WASH_LIGHT }}
    >
      <LightBandDecor />

      <Container className="relative">
        <BandHeader
          id="two-approaches"
          heading={content.heading}
          intro={content.intro}
        />

        <RevealStagger className="mt-10 grid gap-2 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] lg:gap-0">
          <RevealItem className="h-full">
            <Column column={rival} asHeading={asHeading} />
          </RevealItem>
          <RevealItem className="h-full self-stretch">
            <Divider />
          </RevealItem>
          <RevealItem className="h-full">
            <Column column={cleanstart} asHeading={asHeading} />
          </RevealItem>
        </RevealStagger>
      </Container>
    </Section>
  );
}
