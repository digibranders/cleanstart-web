import Link from "next/link";
import { Section, Container } from "@/components/layout";
import {
  HeroReveal,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/ui/Reveal";
import {
  cleanstartOnlyRows,
  matrixDifferenceCount,
  matrixRowCount,
  rowsAgree,
  type CompareContent,
  type MatrixGroup,
} from "./compare-types";
import {
  BAND_DARK,
  Glow,
  Icon3D,
  VectorGrid,
  VendorMark,
  WASH_LIGHT,
} from "./compare-visuals";
import { FingerprintReveal } from "./FingerprintReveal";

/**
 * `/compare` — the hub the comparison pages hang off.
 *
 * A grid of identical "versus" cards. Each opens on a duel masthead (the
 * rival's logo, a slanted seam, CleanStart's mark, "vs" on the seam), so the
 * page says what it is before a word is read. Under it: the comparison's name,
 * its matrix as a fingerprint (one square per capability row: same answer,
 * different answer, only CleanStart), the count in a sentence, and the way in.
 *
 * It is built to grow. Cards are one size in a one, two, three column grid, so
 * a new comparison is a new card and never a layout decision, and a closing
 * tile takes whatever the last row leaves so the grid never ends on a hole.
 * The ledger this replaced read well at three rows and would have been a long
 * scroll at twelve.
 *
 * Everything on a card is composed from the comparison's own `CompareContent`:
 * its headline is `titleParts`, its logo is `rivalMark`, its squares and
 * counts are its own matrix, and its link is its own `path`. The hub restates
 * no comparison in words of its own, so a card can never drift from the page
 * it opens, and listing another comparison is adding it to the array the route
 * passes in.
 *
 * The strings this file does own are UI chrome and are named in `INDEX_UI`
 * below. The hero, the closing tile, the method band and the footer card take
 * their copy from the route, because that is the page's copy and wants SEO's
 * review like any other.
 */

/** Chrome the comparison documents do not write. */
const INDEX_UI = {
  cardCta: "See the comparison",
  legendSame: "Same answer",
  legendDifferent: "Different answer",
  legendOnly: "Only CleanStart",
  answersMatch: "answers match.",
} as const;

const differPhrase = (n: number): string =>
  n === 1 ? "1 differs" : `${n} differ`;

export interface CompareIndexFact {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

export interface CompareIndexCopy {
  readonly titleLead: string;
  readonly titleAccent: string;
  readonly standfirst: string;
  /** The tile that closes the card grid. */
  readonly request: {
    readonly heading: string;
    readonly body: string;
    readonly label: string;
    readonly href: string;
  };
  readonly method: {
    readonly heading: string;
    readonly facts: readonly CompareIndexFact[];
  };
}

type CellState = "same" | "different" | "only";

/** Fill-in order. One square every 18ms reads as a scan, not as a wait. */
const CELL_STAGGER_MS = 18;
/** Held back until the card's own reveal has mostly landed. */
const CELL_DELAY_MS = 260;

/**
 * One hue, three weights: hollow, tinted, solid. The states are a ramp of the
 * brand violet and nothing else, so the fingerprint reads as more or less of
 * one thing and adds no colour of its own to the card.
 */
const CELL_STYLE: Record<CellState, React.CSSProperties> = {
  same: {
    background: "rgba(255,255,255,0.04)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
  },
  different: {
    background: "rgba(195,162,255,0.34)",
    boxShadow: "inset 0 0 0 1px rgba(195,162,255,0.6)",
  },
  /* Solid, and no glow. The site keeps glows to pin-sized indicator nodes in
     its diagrams; a haloed square on a card is not in its vocabulary. */
  only: {
    background: "#C3A2FF",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
  },
};

/**
 * One capability row, drawn as a square. Decorative: the sentence under the
 * fingerprint carries the counts in words.
 *
 * Inside a `FingerprintReveal` the square waits at `opacity: 0` until the
 * fingerprint is in view and then fills in on its own delay. Outside one (the
 * legend) the `group/fp` variants match nothing and it simply renders.
 */
function Cell({
  state,
  order,
  size,
}: {
  state: CellState;
  order?: number;
  /** Fixed box for the legend and list markers. Omitted in a fingerprint,
   *  where the square fills the grid track it sits in. */
  size?: number;
}): React.ReactElement {
  return (
    <span
      aria-hidden
      className={`block shrink-0 rounded-[28%] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[inview=false]/fp:scale-50 group-data-[inview=false]/fp:opacity-0 motion-reduce:!scale-100 motion-reduce:!opacity-100 motion-reduce:transition-none${size === undefined ? " aspect-square w-full" : ""}`}
      style={{
        ...(size === undefined ? {} : { width: size, height: size }),
        ...(order === undefined
          ? {}
          : { transitionDelay: `${CELL_DELAY_MS + order * CELL_STAGGER_MS}ms` }),
        ...CELL_STYLE[state],
      }}
    />
  );
}

/**
 * The card's masthead: the rival's mark, "vs" on a slanted seam, CleanStart's
 * mark. It is the page's whole proposition in one object, which is why it
 * leads the card, and it needs nothing per comparison but the logo every
 * `CompareContent` already carries.
 *
 * Colour is held back on purpose. The two halves are the card's own glass, one
 * plain and one tinted with the brand violet, and the logos sit on
 * the same plates the comparison pages use (`VendorMark`). An earlier pass set
 * the rival on a full lavender-white half against a second copy of the band
 * gradient: three white slabs became the brightest thing on the page, louder
 * than the headline, and each rival's brand colour was let loose across a
 * third of its card. On a plate the logo is legible and its colour is a
 * detail.
 */
function Duel({ rivalMark }: { rivalMark: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative h-[124px] overflow-hidden sm:h-[136px]"
      style={{
        borderRadius: "18px",
        background: "rgba(255,255,255,0.07)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="absolute inset-y-0 right-0 w-[56%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(169,116,255,0.30) 0%, rgba(169,116,255,0.14) 100%)",
          clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      />
      <div className="absolute inset-y-0 left-0 grid w-1/2 place-items-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:-translate-x-1 motion-reduce:transform-none">
        <VendorMark tone="rival" rivalMark={rivalMark} size={60} />
      </div>
      <div className="absolute inset-y-0 right-0 grid w-1/2 place-items-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:translate-x-1 motion-reduce:transform-none">
        <VendorMark tone="cleanstart" rivalMark={rivalMark} size={60} />
      </div>
      <span
        className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display"
        style={{
          background: "#1A1B57",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.24)",
          color: "rgba(255,255,255,0.86)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "var(--fs-badge-ls)",
          textTransform: "uppercase",
        }}
      >
        vs
      </span>
    </div>
  );
}

/** Largest a fingerprint square is drawn; narrower columns shrink it. */
const CELL_MAX_PX = 10;
/** Extra track between two matrix groups, on top of the grid gap. */
const GROUP_GAP_PX = 5;

/**
 * A comparison's matrix as one line of squares, a square per capability row.
 *
 * The groups are the source document's own and a slightly wider gap is all
 * that marks them: the hub once set every group's label under its run, which
 * made each row five captions to read before the comparison's name had
 * registered. The labels live in the table the row opens.
 *
 * One grid, so the line always fits its column: every square is a
 * `minmax(0, 10px)` track and they narrow together, where a wrapping run left
 * the 32-row Docker matrix on two lines and the others on one. On a phone a
 * single line would shrink the squares to specks, so there the tracks
 * auto-fill at full size and the group spacers drop out.
 */
function Fingerprint({
  groups,
  onlyIds,
}: {
  groups: readonly MatrixGroup[];
  onlyIds: ReadonlySet<string>;
}): React.ReactElement {
  const columns = groups
    .map((group) => `repeat(${group.rows.length}, minmax(0, ${CELL_MAX_PX}px))`)
    .join(` ${GROUP_GAP_PX}px `);
  let order = 0;
  return (
    <FingerprintReveal
      className="grid gap-[2px] [grid-template-columns:repeat(auto-fill,10px)] sm:[grid-template-columns:var(--fp-columns)]"
      style={{ "--fp-columns": columns } as React.CSSProperties}
    >
      {groups.flatMap((group, groupIndex) => [
        ...(groupIndex === 0
          ? []
          : [
              <span
                key={`${group.id}-gap`}
                aria-hidden
                className="hidden sm:block"
              />,
            ]),
        ...group.rows.map((row) => (
          <Cell
            key={row.id}
            order={order++}
            state={
              onlyIds.has(row.id)
                ? "only"
                : rowsAgree(row)
                  ? "same"
                  : "different"
            }
          />
        )),
      ])}
    </FingerprintReveal>
  );
}

/**
 * The site's glass, not a new surface: the lavender-tinted fill, corner
 * highlight and hairline `AudienceTabs` sets its tab bar in on the same band.
 * The cards were opaque near-black navy with a deep drop shadow, which read as
 * three holes punched in the gradient; glass lets the band through and lifts
 * them instead.
 */
const CARD_SURFACE: React.CSSProperties = {
  borderRadius: "24px",
  background:
    "radial-gradient(120% 90% at 0% 0%, rgba(218,182,243,0.18) 0%, rgba(52,34,102,0) 62%), rgba(187,175,255,0.09)",
  border: "1px solid rgba(255,255,255,0.16)",
};

/** The arrow the hub's card link ends on. Bare, the way `BlogCard` sets its
    "Read more": the site has no circled-arrow button, and a hairline disc
    beside its 8px-radius buttons read as a control from another system. */
function Arrow(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:translate-x-1 motion-reduce:transform-none"
    >
      <path
        d="M3.5 8h9M9 4.5 12.5 8 9 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One comparison. Four things, top to bottom: who (the duel), its name, how
 * different the answers are (the fingerprint and its sentence), and the way
 * in. Nothing else: the "only CleanStart" capabilities the ledger listed are
 * still in the squares, and in words on the page the card opens.
 */
function VersusCard({
  content,
}: {
  content: CompareContent;
}): React.ReactElement {
  const total = matrixRowCount(content.matrix);
  const differences = matrixDifferenceCount(content.matrix);
  const onlyIds = new Set(
    cleanstartOnlyRows(content.matrix).map((row) => row.id),
  );

  return (
    // `group/card` drives the lift, the logos and the arrow from the card's
    // own hover, so the whole tile is one target.
    <article
      className="group/card relative flex h-full flex-col p-2 shadow-[inset_1px_1px_0_rgba(218,182,243,0.38),inset_-1px_-1px_0_rgba(218,182,243,0.14)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[inset_1px_1px_0_rgba(218,182,243,0.7),inset_-1px_-1px_0_rgba(218,182,243,0.34)] focus-within:shadow-[inset_1px_1px_0_rgba(218,182,243,0.7),inset_-1px_-1px_0_rgba(218,182,243,0.34)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={CARD_SURFACE}
    >
      <Duel rivalMark={content.rivalMark} />

      <div className="flex flex-1 flex-col px-4 pb-4 pt-6 sm:px-5 sm:pb-5">
        <h2
          className="min-h-[2lh] font-display text-white"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: "var(--fs-h4-weight)",
            letterSpacing: "var(--fs-h4-ls)",
            lineHeight: "var(--fs-h4-lh)",
            textWrap: "balance",
          }}
        >
          {/* Stretched over the card, so the headline stays the accessible
              name of the card's one link. */}
          <Link
            href={content.path}
            className="after:absolute after:inset-0 after:rounded-[24px] after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[#33BAEC]"
          >
            {content.titleParts.lead}
            {content.titleParts.accent}
          </Link>
        </h2>

        <div className="mt-6">
          <Fingerprint groups={content.matrix.groups} onlyIds={onlyIds} />
        </div>

        {/* The count in a sentence. It was a display-size "15/32", which left
            a reader to work out what was divided and in whose favour. */}
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: "var(--fs-body-sm-lh)",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          <strong className="font-semibold text-white">
            {total - differences} of {total}
          </strong>{" "}
          {INDEX_UI.answersMatch}{" "}
          <strong className="font-semibold text-white">
            {differPhrase(differences)}
          </strong>
          .
        </p>

        <span
          aria-hidden
          className="mt-auto inline-flex items-center gap-2 pt-6 font-display text-white"
          style={{
            fontSize: "var(--fs-button-sm)",
            fontWeight: "var(--fs-button-weight)",
            letterSpacing: "var(--fs-button-ls)",
          }}
        >
          {INDEX_UI.cardCta}
          <Arrow />
        </span>
      </div>
    </article>
  );
}

/**
 * How many grid cells the closing tile takes so the last row is never ragged.
 * It fills whatever the cards leave of their final row, and takes a row of its
 * own when they leave nothing. Class names are spelled out because Tailwind
 * only emits classes it can read in the source.
 */
const SPAN_MD = { 1: "md:col-span-1", 2: "md:col-span-2" } as const;
const SPAN_LG = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
} as const;

const closingSpan = (count: number, columns: 2 | 3): number =>
  count % columns === 0 ? columns : columns - (count % columns);

/**
 * The tile that closes the grid: the way out for a reader whose vendor is not
 * listed. It is also what lets the grid grow one card at a time without ever
 * ending on a hole, which is the difference between a layout drawn for three
 * comparisons and one that still holds at thirteen.
 */
function RequestTile({
  copy,
  count,
}: {
  copy: CompareIndexCopy["request"];
  count: number;
}): React.ReactElement {
  const md = closingSpan(count, 2) as 1 | 2;
  const lg = closingSpan(count, 3) as 1 | 2 | 3;
  return (
    <div
      className={`flex h-full flex-col justify-between gap-6 p-6 sm:p-7 ${SPAN_MD[md]} ${SPAN_LG[lg]} ${lg === 3 ? "lg:flex-row lg:items-center" : ""}`}
      style={{
        borderRadius: "24px",
        border: "1px dashed rgba(255,255,255,0.22)",
      }}
    >
      <div>
        <h2
          className="font-display text-white"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: "var(--fs-h4-weight)",
            letterSpacing: "var(--fs-h4-ls)",
            lineHeight: "var(--fs-h4-lh)",
          }}
        >
          {copy.heading}
        </h2>
        <p
          className="mt-2.5"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: "var(--fs-body-sm-lh)",
            color: "rgba(255,255,255,0.68)",
            maxWidth: "52ch",
          }}
        >
          {copy.body}
        </p>
      </div>
      {/* The site's glass button, at the 44px the hero pair uses. */}
      <Link
        href={copy.href}
        className="cs-btn-glass shrink-0 self-start lg:self-auto"
        style={
          {
            "--cs-btn-h": "44px",
            "--cs-btn-px": "22px",
            "--cs-btn-fs": "var(--fs-button)",
          } as React.CSSProperties
        }
      >
        <span>{copy.label}</span>
      </Link>
    </div>
  );
}

/** The key to the fingerprints, set directly above them. */
function Legend(): React.ReactElement {
  const items: readonly (readonly [CellState, string])[] = [
    ["same", INDEX_UI.legendSame],
    ["different", INDEX_UI.legendDifferent],
    ["only", INDEX_UI.legendOnly],
  ];
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-3">
      {items.map(([state, label]) => (
        <li
          key={state}
          className="flex items-center gap-2"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 500,
            lineHeight: "var(--fs-caption-lh)",
            color: "rgba(255,255,255,0.74)",
          }}
        >
          <Cell state={state} size={14} />
          {label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The hub's dark frame: the hero and the card grid on one continuous band.
 *
 * They are one section of the page, not two: the legend and the squares it
 * explains belong in the same room, and the first row of cards lands inside
 * the opening viewport, where the previous hero spent that space on a button
 * that led away from the page.
 *
 * No call to action in the hero for the same reason: the cards are the action.
 * The route closes on the footer's CTA card instead.
 */
export function CompareIndexGrid({
  copy,
  comparisons,
}: {
  copy: CompareIndexCopy;
  comparisons: readonly CompareContent[];
}): React.ReactElement {
  return (
    <section
      data-section="CompareIndexGrid"
      className="relative overflow-hidden"
      style={{ background: BAND_DARK, backgroundColor: "#151021" }}
    >
      <VectorGrid side="right" top="-6%" opacity={0.5} />
      <Glow
        color="rgba(169,116,255,0.24)"
        size="min(820px, 56%)"
        right="-10%"
        top="-22%"
      />
      <Glow
        color="rgba(7,110,255,0.2)"
        size="min(640px, 46%)"
        left="-14%"
        top="34%"
      />

      <div
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(104px, 9vw, 136px) + var(--cs-header-extra))",
          paddingBottom: "var(--spacing-section-md)",
        }}
      >
        <HeroReveal y={50} duration={1} lcp>
          <h1
            className="font-display text-white"
            style={{
              fontSize: "var(--fs-display)",
              fontWeight: "var(--fs-display-weight)",
              letterSpacing: "var(--fs-display-ls)",
              lineHeight: "var(--fs-display-lh)",
              maxWidth: "16ch",
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
              fontSize: "var(--fs-lead-sm)",
              fontWeight: "var(--fs-lead-weight)",
              letterSpacing: "var(--fs-lead-ls)",
              lineHeight: "var(--fs-lead-lh)",
              color: "rgba(255,255,255,0.78)",
              maxWidth: "52ch",
              marginTop: "clamp(16px, 1.6vw, 24px)",
            }}
          >
            {copy.standfirst}
          </p>
        </HeroReveal>

        {/* The key sits on the cards it explains, not up in the hero. */}
        <div className="mt-12 lg:mt-16">
          <Legend />
        </div>

        {/* One, two, three columns, and cards that are all the same size: the
            grid takes a fourth comparison or a fourteenth without a layout
            decision, and the closing tile squares off the last row. */}
        <RevealStagger className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {comparisons.map((content) => (
            <RevealItem key={content.path}>
              <VersusCard content={content} />
            </RevealItem>
          ))}
          <RevealItem
            className={`${SPAN_MD[closingSpan(comparisons.length, 2) as 1 | 2]} ${SPAN_LG[closingSpan(comparisons.length, 3) as 1 | 2 | 3]}`}
          >
            <RequestTile copy={copy.request} count={comparisons.length} />
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}

/**
 * How the comparisons are made.
 *
 * A reader arriving on a comparison query assumes the page is selling. What
 * earns the tables a hearing is the method, and the hub is the one place it
 * can be said once for all of them: where the answers come from, that matching
 * rows are kept, and that each table is dated and marks what varies.
 *
 * Reserves `--spacing-section-cta` below itself for the footer's CTA card,
 * the way `CompareFAQ` does on the comparison pages.
 */
export function CompareIndexMethod({
  method,
}: {
  method: CompareIndexCopy["method"];
}): React.ReactElement {
  return (
    <Section
      padding="none"
      data-section="CompareIndexMethod"
      className="relative pt-[var(--spacing-section-lg)] pb-[var(--spacing-section-cta)]"
      style={{ background: WASH_LIGHT }}
      aria-labelledby="compare-method-title"
    >
      <Container>
        <div className="grid gap-y-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-x-16">
          <Reveal header>
            <h2
              id="compare-method-title"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: "var(--fs-h2-weight)",
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
                maxWidth: "13ch",
              }}
            >
              {method.heading}
            </h2>
          </Reveal>

          <RevealStagger className="grid gap-y-9 md:grid-cols-3 md:gap-x-0">
            {method.facts.map((fact, index) => (
              <RevealItem
                key={fact.id}
                className={
                  index === 0
                    ? "md:pr-8"
                    : "md:border-l md:border-[rgba(17,17,17,0.11)] md:px-8"
                }
              >
                <Icon3D src={fact.icon} size={64} />
                <h3
                  className="mt-5 font-display text-[#111111]"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: "var(--fs-h4-weight)",
                    letterSpacing: "var(--fs-h4-ls)",
                    lineHeight: "var(--fs-h4-lh)",
                  }}
                >
                  {fact.title}
                </h3>
                <p
                  className="mt-2.5"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body-sm)",
                    lineHeight: "var(--fs-body-sm-lh)",
                    letterSpacing: "var(--fs-body-ls)",
                    color: "#333333",
                    maxWidth: "34ch",
                  }}
                >
                  {fact.body}
                </p>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
