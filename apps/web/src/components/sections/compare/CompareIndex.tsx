import Link from "next/link";
import { Section, Container } from "@/components/layout";
import { HeroReveal } from "@/components/ui/Reveal";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import {
  cleanstartOnlyRows,
  matrixDifferenceCount,
  matrixRowCount,
  type CompareContent,
} from "./compare-types";
import {
  BRAND,
  cornerAt,
  CornerTile,
  Glow,
  LightBandDecor,
  VendorMark,
  WASH_LIGHT,
} from "./compare-visuals";

/**
 * `/compare` — the hub the three comparison pages hang off.
 *
 * Every card is composed from the comparison's own `CompareContent`: its
 * headline is `titleParts`, its sentence is the `standfirst` its source
 * document wrote, its counts are derived from its own matrix, and its link is
 * its own `path`. Nothing here restates a comparison in words of the hub's
 * own, so a card can never drift from the page it points at, and adding a
 * fourth comparison is adding it to the array the route passes in.
 *
 * The two strings this file does own are UI chrome and are named in `INDEX_UI`
 * below. The hero's own headline and sentence come from the route, because
 * they are the page's copy and want SEO's review like any other.
 */

/** Chrome the comparison documents do not write. */
const INDEX_UI = {
  cardCta: "See the comparison",
  of: "of",
  capabilities: "capabilities differ",
  /** Lead-in for the capabilities the rival's own column records as absent. */
  onlyCleanStart: "Only CleanStart",
  /** Remainder chip when a comparison records more than the three shown. */
  more: "+{n} more",
  /** Accessible name for each card's proportion bar. */
  barLabel: "Proportion of capabilities where the two answers differ",
  /**
   * The hero's scale line. Rows are counted, not merged: the three source
   * documents name capabilities in their own vocabularies, so "84 capability
   * rows" is the sum of three tables and deliberately not a claim that 84
   * distinct capabilities exist across them.
   */
  statComparisons: "comparisons",
  statRows: "capability rows",
  statDifferences: "where they differ",
} as const;

export interface CompareIndexCopy {
  readonly titleLead: string;
  readonly titleAccent: string;
  readonly standfirst: string;
}

/**
 * The rival's mark and CleanStart's, with the page's "vs" marker between them.
 * The same pairing the comparison pages set at the top of their capability
 * table, so a card is recognisable as the page it opens.
 */
function MarkPair({ rivalMark }: { rivalMark: string }): React.ReactElement {
  return (
    <span className="flex items-center gap-2.5">
      <VendorMark tone="rival" rivalMark={rivalMark} size={34} />
      <span
        aria-hidden
        className="font-display"
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "var(--fs-badge-ls)",
          textTransform: "uppercase",
          color: "rgba(17,17,17,0.45)",
        }}
      >
        vs
      </span>
      <VendorMark tone="cleanstart" rivalMark={rivalMark} size={34} />
    </span>
  );
}

/**
 * The identical / differ proportion, drawn with the same two colours the
 * capability table uses for its columns. The comparison pages open on the
 * same bar, so a card and the page it links to state the split the same way.
 */
function SplitBar({
  total,
  differences,
}: {
  total: number;
  differences: number;
}): React.ReactElement {
  const differPct = total === 0 ? 0 : (differences / total) * 100;
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full"
      role="img"
      aria-label={`${INDEX_UI.barLabel}: ${differences} of ${total}`}
    >
      <span
        className="block h-full"
        style={{ width: `${100 - differPct}%`, background: "rgba(17,17,17,0.13)" }}
      />
      <span
        className="block h-full"
        style={{
          width: `${differPct}%`,
          background: `linear-gradient(90deg, ${BRAND.violet}, ${BRAND.blue})`,
        }}
      />
    </div>
  );
}

function Card({
  content,
  corner,
}: {
  content: CompareContent;
  corner: ReturnType<typeof cornerAt>;
}): React.ReactElement {
  const rows = matrixRowCount(content.matrix);
  const differences = matrixDifferenceCount(content.matrix);
  /* Capped at three, with the rest counted: this is a preview of the
     argument, not the argument. The Docker comparison records seven and the
     card would become a list. */
  const onlyAll = cleanstartOnlyRows(content.matrix);
  const onlyOurs = onlyAll.slice(0, 3);
  const onlyRest = onlyAll.length - onlyOurs.length;

  return (
    <CornerTile
      corner={corner}
      // `group` drives the arrow nudge and the border lift from the card's own
      // hover, so the whole tile is one target rather than a tile with a link
      // somewhere inside it.
      className="group transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[rgba(106,61,240,0.35)] hover:shadow-[0_1px_2px_rgba(17,17,17,0.04),0_28px_56px_-40px_rgba(70,30,190,0.45)] focus-within:border-[rgba(106,61,240,0.35)]"
    >
      <MarkPair rivalMark={content.rivalMark} />

      {/* Two lines of headline are reserved wherever the cards sit side by
          side, so every card's paragraph starts on the same line. "Chainguard
          vs CleanStart" fits on one line while the other two wrap, and without
          this its body floated a line above its neighbours'. A floor, not a
          fixed height: a longer rival name still takes the lines it needs.
          Below `md` the cards stack and a reserved empty line is just a gap. */}
      <h2
        className="mt-5 font-display text-[#111111] md:min-h-[2lh]"
        style={{
          fontSize: "var(--fs-h4)",
          fontWeight: "var(--fs-h4-weight)",
          letterSpacing: "var(--fs-h4-ls)",
          lineHeight: "var(--fs-h4-lh)",
        }}
      >
        {/* The card is the whole tile: this link is stretched over it, so the
            headline stays the accessible name of the one link. */}
        <Link
          href={content.path}
          className="after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
        >
          {content.titleParts.lead}
          <span className="cs-text-gradient-impact">
            {content.titleParts.accent}
          </span>
        </Link>
      </h2>

      {/* Floored for the same reason as the headline: the three standfirsts
          run to three or four lines, and without this the proportion bars sit
          at three different heights and stop being comparable at a glance. */}
      <p
        className="mt-3 md:min-h-[4lh]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body-sm)",
          lineHeight: "var(--fs-body-sm-lh)",
          letterSpacing: "var(--fs-body-ls)",
          color: "#333333",
        }}
      >
        {content.standfirst}
      </p>

      {/* Everything below is derived from this comparison's own matrix, so a
          card cannot advertise a split or a capability the table then
          contradicts. */}
      <div className="pt-6">
        <SplitBar total={rows} differences={differences} />
        <p
          className="mt-3"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: "var(--fs-body-sm-lh)",
            color: "rgba(17,17,17,0.62)",
          }}
        >
          <span className="font-display" style={{ fontWeight: 600, color: BRAND.violet }}>
            {differences}
          </span>{" "}
          {INDEX_UI.of}{" "}
          <span className="font-display" style={{ fontWeight: 600, color: "#111111" }}>
            {rows}
          </span>{" "}
          {INDEX_UI.capabilities}
        </p>

        {onlyOurs.length > 0 && (
          <div className="mt-5">
            <p
              className="font-display"
              style={{
                fontSize: "var(--fs-eyebrow)",
                fontWeight: "var(--fs-eyebrow-weight)",
                letterSpacing: "var(--fs-eyebrow-ls)",
                lineHeight: "var(--fs-eyebrow-lh)",
                textTransform: "uppercase",
                color: BRAND.violet,
              }}
            >
              {INDEX_UI.onlyCleanStart}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {onlyOurs.map((row) => (
                <li
                  key={row.id}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    border: "1px solid rgba(106,61,240,0.24)",
                    background: "rgba(106,61,240,0.06)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    lineHeight: "var(--fs-caption-lh)",
                    color: "#111111",
                  }}
                >
                  {row.capability}
                </li>
              ))}
              {onlyRest > 0 && (
                <li
                  className="rounded-full px-2.5 py-1"
                  style={{
                    border: "1px dashed rgba(106,61,240,0.32)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    lineHeight: "var(--fs-caption-lh)",
                    color: BRAND.violet,
                  }}
                >
                  {INDEX_UI.more.replace("{n}", String(onlyRest))}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <span
        aria-hidden
        className="mt-auto inline-flex items-center gap-2 pt-6 font-display"
        style={{
          fontSize: "var(--fs-button-sm)",
          fontWeight: "var(--fs-button-weight)",
          letterSpacing: "var(--fs-button-ls)",
          color: BRAND.violet,
        }}
      >
        {INDEX_UI.cardCta}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          <path
            d="M3.5 8h9M9 4.5 12.5 8 9 11.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </CornerTile>
  );
}

function HeroStat({
  value,
  label,
}: {
  value: number;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1 px-1 text-center sm:items-start sm:text-left">
      <span
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "var(--fs-h3-ls)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          lineHeight: "var(--fs-caption-lh)",
          color: "rgba(255,255,255,0.62)",
          maxWidth: "18ch",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function CompareIndexHero({
  copy,
  comparisons,
}: {
  copy: CompareIndexCopy;
  comparisons: readonly CompareContent[];
}): React.ReactElement {
  const rows = comparisons.reduce((t, c) => t + matrixRowCount(c.matrix), 0);
  const differences = comparisons.reduce(
    (t, c) => t + matrixDifferenceCount(c.matrix),
    0,
  );
  return (
    <section
      data-section="CompareIndexHero"
      className="relative overflow-hidden bg-cs-hero"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-0 hidden w-full select-none md:block"
        style={{ height: "520px", objectFit: "cover", opacity: 0.6 }}
        loading="eager"
        decoding="async"
      />
      <Glow
        color="rgba(169,116,255,0.28)"
        size="min(760px, 52%)"
        right="-6%"
        top="-18%"
      />
      <Glow
        color="rgba(7,110,255,0.22)"
        size="min(560px, 42%)"
        left="-10%"
        bottom="-14%"
      />

      <div
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(104px, 9vw, 136px) + var(--cs-header-extra))",
          paddingBottom: "clamp(72px, 8vw, 116px)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <HeroReveal y={50} duration={1} lcp>
            <h1
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-display)",
                fontWeight: "var(--fs-display-weight)",
                letterSpacing: "var(--fs-display-ls)",
                lineHeight: "var(--fs-display-lh)",
                maxWidth: "20ch",
                textWrap: "balance",
              }}
            >
              {copy.titleLead}
              <span className="cs-text-gradient-impact">{copy.titleAccent}</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: "var(--fs-lead-weight)",
                letterSpacing: "var(--fs-lead-ls)",
                lineHeight: "var(--fs-lead-lh)",
                color: "rgba(255,255,255,0.78)",
                maxWidth: "62ch",
                marginTop: "clamp(20px, 2vw, 28px)",
              }}
            >
              {copy.standfirst}
            </p>

            {/* Counted from the three matrices, so the hero cannot claim a
                scale the pages below do not carry. */}
            <dl className="mt-10 flex flex-wrap items-start justify-center gap-x-10 gap-y-6 sm:gap-x-14">
              <div>
                <dt className="sr-only">{INDEX_UI.statComparisons}</dt>
                <dd>
                  <HeroStat
                    value={comparisons.length}
                    label={INDEX_UI.statComparisons}
                  />
                </dd>
              </div>
              <span
                aria-hidden
                className="hidden h-10 w-px self-center sm:block"
                style={{ background: "rgba(255,255,255,0.16)" }}
              />
              <div>
                <dt className="sr-only">{INDEX_UI.statRows}</dt>
                <dd>
                  <HeroStat value={rows} label={INDEX_UI.statRows} />
                </dd>
              </div>
              <span
                aria-hidden
                className="hidden h-10 w-px self-center sm:block"
                style={{ background: "rgba(255,255,255,0.16)" }}
              />
              <div>
                <dt className="sr-only">{INDEX_UI.statDifferences}</dt>
                <dd>
                  <HeroStat
                    value={differences}
                    label={INDEX_UI.statDifferences}
                  />
                </dd>
              </div>
            </dl>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}

export function CompareIndexList({
  comparisons,
}: {
  comparisons: readonly CompareContent[];
}): React.ReactElement {
  return (
    // `padding="md"` and a bare `<Footer />`, the pattern the site's other
    // listing pages use (`CaseStudiesGrid`, the resource centre). No CTA card
    // means no overlap to reserve, so `--spacing-section-cta` here would just
    // leave a band of empty wash above the footer.
    <Section
      padding="md"
      data-section="CompareIndexList"
      className="relative overflow-hidden"
      style={{ background: WASH_LIGHT }}
    >
      <LightBandDecor />

      <Container className="relative">
        <RevealStagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {comparisons.map((content, index) => (
            <RevealItem key={content.path} className="h-full">
              <Card content={content} corner={cornerAt(index)} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
