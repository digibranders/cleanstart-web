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
  BAND_DARK,
  BRAND,
  EllipseGlow,
  Glow,
  HexOutline,
  VendorMark,
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
          color: "rgba(255,255,255,0.45)",
        }}
      >
        vs
      </span>
      <VendorMark tone="cleanstart" rivalMark={rivalMark} size={34} />
    </span>
  );
}

/**
 * The comparison's capabilities as one cell each, the differing ones lit.
 *
 * A two-colour bar showed the proportion but hid the scale, so a 26-row and a
 * 32-row comparison drew the same object. One cell per capability shows both
 * at once: the Docker card is visibly a longer row than the other two before
 * anyone reads a number. It is also the page's own subject matter drawn
 * literally, which a bar is not.
 *
 * Differing cells come first rather than interleaved, so the lit run reads as
 * a quantity instead of noise.
 */
function CapabilityCells({
  total,
  differences,
}: {
  total: number;
  differences: number;
}): React.ReactElement {
  return (
    <div
      className="flex flex-wrap gap-[3px]"
      role="img"
      aria-label={`${INDEX_UI.barLabel}: ${differences} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="block size-[7px] rounded-[2px]"
          style={
            i < differences
              ? {
                  background: `linear-gradient(135deg, ${BRAND.violetLight}, ${BRAND.blue})`,
                  boxShadow: "0 0 10px -2px rgba(130,120,255,0.9)",
                }
              : { background: "rgba(255,255,255,0.14)" }
          }
        />
      ))}
    </div>
  );
}

/**
 * One comparison, as a glass panel on the dark band.
 *
 * The first version was a white tile on a light wash: flat, and it put the
 * card's most important number, how many capabilities differ, in the smallest
 * grey text on it. Here the number is the largest thing after the headline,
 * the capability cells sit directly under it, and the violet reads as an
 * accent instead of as one more grey.
 *
 * The material is the one `DarkPanel` uses on the build-process band, so the
 * hub is recognisably the same system as the pages it links to.
 */
function Card({
  content,
  index,
}: {
  content: CompareContent;
  /** Only used to vary which corner carries the oversized radius. */
  index: number;
}): React.ReactElement {
  const rows = matrixRowCount(content.matrix);
  const differences = matrixDifferenceCount(content.matrix);
  /* Capped at three, with the rest counted: this is a preview of the
     argument, not the argument. The Docker comparison records seven and the
     card would become a list. */
  const onlyAll = cleanstartOnlyRows(content.matrix);
  const onlyOurs = onlyAll.slice(0, 3);
  const onlyRest = onlyAll.length - onlyOurs.length;
  const bigCorner = index % 2 === 0 ? "44px 14px 14px 14px" : "14px 44px 14px 14px";

  return (
    <article
      /* A subgrid item spanning the six rows the band declares, so the marks,
         headline, body, metric, chips and link of all three cards sit on the
         same six lines however many lines each standfirst runs to. Those run
         to four, five or six by width, so no `min-height` floor can align
         them; an earlier `md:min-h-[4lh]` held at 1440 and drifted at 1280. */
      className="group relative row-span-6 grid grid-rows-subgrid overflow-hidden transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[rgba(169,116,255,0.55)]"
      style={{
        rowGap: 0,
        borderRadius: bigCorner,
        border: "1px solid rgba(140,160,255,0.18)",
        background: [
          "radial-gradient(70% 55% at 12% 0%, rgba(106,61,240,0.22) 0%, rgba(106,61,240,0) 70%)",
          "linear-gradient(180deg, rgba(16,20,56,0.92) 0%, rgba(8,11,34,0.97) 100%)",
        ].join(", "),
        boxShadow: [
          "0 34px 80px -46px rgba(0,0,0,0.85)",
          "inset 0 1px 0 rgba(255,255,255,0.07)",
        ].join(", "),
        padding: "clamp(24px, 2vw, 32px)",
      }}
    >
      {/* Ambient light that follows the hover, so the card reads as a surface
          rather than a rectangle with a border. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-[300px] select-none rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(closest-side, rgba(169,116,255,0.22), transparent 72%)",
        }}
      />

      <span className="relative block">
        <MarkPair rivalMark={content.rivalMark} />
      </span>

        <h2
          className="relative mt-6 font-display text-white"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: "var(--fs-h4-weight)",
            letterSpacing: "var(--fs-h4-ls)",
            lineHeight: "var(--fs-h4-lh)",
          }}
        >
          {/* The card is the whole tile: this link is stretched over it, so
              the headline stays the accessible name of the one link. */}
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

        <p
          className="relative mt-3.5"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: "var(--fs-body-sm-lh)",
            letterSpacing: "var(--fs-body-ls)",
            color: "rgba(255,255,255,0.64)",
          }}
        >
          {content.standfirst}
        </p>

        {/* Everything below is derived from this comparison's own matrix, so a
            card cannot advertise a split or a capability the table then
            contradicts. */}
        <div
          className="relative mt-7 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-baseline gap-2.5">
            <span
              className="font-display"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                lineHeight: 0.9,
                letterSpacing: "var(--fs-h2-ls)",
                color: "#ffffff",
              }}
            >
              {differences}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-body-sm)",
                lineHeight: "var(--fs-body-sm-lh)",
                color: "rgba(255,255,255,0.62)",
              }}
            >
              {INDEX_UI.of} {rows} {INDEX_UI.capabilities}
            </span>
          </div>

          <div className="mt-4">
            <CapabilityCells total={rows} differences={differences} />
          </div>
        </div>

        {/* Always rendered, even when a comparison records none, so every card
            occupies the same six rows. */}
        <div className="relative mt-7">
          {onlyOurs.length > 0 && (
          <>
            <p
              className="font-display"
              style={{
                fontSize: "var(--fs-eyebrow)",
                fontWeight: "var(--fs-eyebrow-weight)",
                letterSpacing: "var(--fs-eyebrow-ls)",
                lineHeight: "var(--fs-eyebrow-lh)",
                textTransform: "uppercase",
                color: BRAND.violetPale,
              }}
            >
              {INDEX_UI.onlyCleanStart}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {onlyOurs.map((row) => (
                <li
                  key={row.id}
                  className="rounded-full px-3 py-1.5"
                  style={{
                    border: "1px solid rgba(169,116,255,0.32)",
                    background: "rgba(106,61,240,0.22)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    lineHeight: "var(--fs-caption-lh)",
                    color: "#EFE7FF",
                  }}
                >
                  {row.capability}
                </li>
              ))}
              {onlyRest > 0 && (
                <li
                  className="rounded-full px-3 py-1.5"
                  style={{
                    border: "1px dashed rgba(169,116,255,0.4)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    lineHeight: "var(--fs-caption-lh)",
                    color: BRAND.violetPale,
                  }}
                >
                  {INDEX_UI.more.replace("{n}", String(onlyRest))}
                </li>
              )}
            </ul>
          </>
          )}
        </div>

        <span
          aria-hidden
          className="relative inline-flex items-center gap-2 pt-7 font-display text-white"
          style={{
            fontSize: "var(--fs-button-sm)",
            fontWeight: "var(--fs-button-weight)",
            letterSpacing: "var(--fs-button-ls)",
          }}
        >
          {INDEX_UI.cardCta}
          <span
            className="inline-flex size-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
            style={{
              background: `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.blue})`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 8h9M9 4.5 12.5 8 9 11.5"
                stroke="#ffffff"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
    </article>
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
    // Dark, continuing the hero rather than breaking to a light wash. The hub
    // is one band: the hero states what the comparisons are, the cards are
    // the comparisons, and nothing sits between them. It also puts the cards
    // on the same material as the build-process panel the pages themselves
    // use, so the hub reads as part of the same system.
    <Section
      padding="md"
      data-section="CompareIndexList"
      className="relative overflow-hidden"
      style={{ background: BAND_DARK }}
    >
      <HexOutline side="right" />
      <EllipseGlow side="left" size="380px" />

      <Container className="relative">
        {/* Six explicit rows the cards subgrid onto. The chain is grid ->
            RevealItem -> article, and `RevealItem` renders exactly one div
            with the className passed through, so the article still resolves
            against this grid's rows. */}
        <RevealStagger className="grid grid-rows-[repeat(6,auto)] gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {comparisons.map((content, index) => (
            <RevealItem key={content.path} className="row-span-6 grid grid-rows-subgrid">
              <Card content={content} index={index} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
