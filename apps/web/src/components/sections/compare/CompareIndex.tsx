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
  BRAND,
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
 * The comparison pages open their capability table by conceding the parity:
 * most rows are the same, and here is where they are not. The hub draws that
 * argument instead of summarising it. Each comparison is a row in one ledger,
 * and its matrix is set out as a fingerprint: one square per capability row,
 * in three states (same answer, different answer, only CleanStart). A reader
 * sees how much is shared and where the differences sit before opening a page.
 *
 * A row is kept to three things: who is compared, how different the answers
 * are, and what only CleanStart has. An earlier pass also set every matrix
 * group's label under its squares and a descriptor under the name; reviewed
 * on screen it was a dashboard to decode, not a list to choose from.
 *
 * Everything in a row is composed from the comparison's own `CompareContent`:
 * its headline is `titleParts`, its squares and counts are its own matrix, and
 * its link is its own `path`. The hub restates no comparison in words of its
 * own, so a row can never drift from the page it opens, and listing a fourth
 * comparison is adding it to the array the route passes in.
 *
 * The strings this file does own are UI chrome and are named in `INDEX_UI`
 * below. The hero, the method band and the closing card take their copy from
 * the route, because that is the page's copy and wants SEO's review like any
 * other.
 */

/** Chrome the comparison documents do not write. */
const INDEX_UI = {
  rowCta: "See the comparison",
  legendSame: "Same answer",
  legendDifferent: "Different answer",
  legendOnly: "Only CleanStart",
  answersMatch: "answers match.",
  /** Lead-in for the capabilities the rival's own column records as absent. */
  onlyCleanStart: "Only CleanStart",
  /** Remainder line when a comparison records more than the three shown. */
  more: "and {n} more",
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
  readonly method: {
    readonly heading: string;
    readonly facts: readonly CompareIndexFact[];
  };
}

type CellState = "same" | "different" | "only";

/** Fill-in order. One square every 18ms reads as a scan, not as a wait. */
const CELL_STAGGER_MS = 18;
/** Held back until the row's own reveal has mostly landed. */
const CELL_DELAY_MS = 260;

const CELL_STYLE: Record<CellState, React.CSSProperties> = {
  same: {
    background: "rgba(255,255,255,0.05)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
  },
  different: {
    background: "rgba(139,92,255,0.55)",
    boxShadow: "inset 0 0 0 1px rgba(223,155,255,0.75)",
  },
  only: {
    background: `linear-gradient(135deg, ${BRAND.violetPale}, #8B5CFF)`,
    boxShadow:
      "0 0 14px rgba(169,116,255,0.7), inset 0 1px 0 rgba(255,255,255,0.55)",
  },
};

/**
 * One capability row, drawn as a square. Decorative: the group link beside it
 * carries the counts in words.
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
 * The rival's mark and CleanStart's, with the page's "vs" marker between them.
 * The same pairing the comparison pages set at the top of their capability
 * table, so a row is recognisable as the page it opens.
 */
function MarkPair({ rivalMark }: { rivalMark: string }): React.ReactElement {
  return (
    <span className="flex items-center gap-2.5">
      <VendorMark tone="rival" rivalMark={rivalMark} size={44} />
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
      <VendorMark tone="cleanstart" rivalMark={rivalMark} size={44} />
    </span>
  );
}

/** Largest a fingerprint square is drawn; narrower columns shrink it. */
const CELL_MAX_PX = 14;
/** Extra track between two matrix groups, on top of the grid gap. */
const GROUP_GAP_PX = 7;

/**
 * A comparison's matrix as one line of squares, a square per capability row.
 *
 * The groups are the source document's own and a slightly wider gap is all
 * that marks them: the hub once set every group's label under its run, which
 * made each row five captions to read before the comparison's name had
 * registered. The labels live in the table the row opens.
 *
 * One grid, so the line always fits its column: every square is a
 * `minmax(0, 14px)` track and they narrow together, where a wrapping run left
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
      className="grid gap-[3px] [grid-template-columns:repeat(auto-fill,14px)] sm:[grid-template-columns:var(--fp-columns)]"
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

function LedgerRow({
  content,
}: {
  content: CompareContent;
}): React.ReactElement {
  const total = matrixRowCount(content.matrix);
  const differences = matrixDifferenceCount(content.matrix);
  /* Capped at three, with the rest counted: this is a preview of the
     argument, not the argument. The Docker comparison records seven and the
     column would become the table. */
  const onlyAll = cleanstartOnlyRows(content.matrix);
  const onlyIds = new Set(onlyAll.map((row) => row.id));
  const onlyShown = onlyAll.slice(0, 3);
  const onlyRest = onlyAll.length - onlyShown.length;

  return (
    // A row answers three questions and stops: who, how different, and what
    // only CleanStart has. `group/row` drives the wash and the arrow from the
    // row's own hover, so the whole row is one target.
    <article className="group/row relative grid gap-y-7 px-6 py-8 transition-colors duration-300 hover:bg-[rgba(255,255,255,0.035)] focus-within:bg-[rgba(255,255,255,0.035)] sm:px-9 lg:grid-cols-[minmax(0,3.2fr)_minmax(0,5.6fr)_minmax(0,3.2fr)_48px] lg:items-center lg:gap-x-10 lg:px-10 lg:py-10">
      <div>
        <MarkPair rivalMark={content.rivalMark} />
        <h2
          className="mt-5 font-display text-white"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: "var(--fs-h4-weight)",
            letterSpacing: "var(--fs-h4-ls)",
            lineHeight: "var(--fs-h4-lh)",
            maxWidth: "22ch",
            textWrap: "balance",
          }}
        >
          {/* Stretched over the row, so the headline stays the accessible name
              of the row's one link. */}
          <Link
            href={content.path}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
          >
            {content.titleParts.lead}
            {content.titleParts.accent}
          </Link>
        </h2>
      </div>

      <div>
        <Fingerprint groups={content.matrix.groups} onlyIds={onlyIds} />
        {/* The count in a sentence. It was a display-size "15/32", which left
            a reader to work out what was being divided and in whose favour. */}
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body-sm)",
            lineHeight: "var(--fs-body-sm-lh)",
            color: "rgba(255,255,255,0.68)",
          }}
        >
          <strong className="font-semibold text-white">
            {total - differences} of {total}
          </strong>{" "}
          {INDEX_UI.answersMatch}{" "}
          <strong className="font-semibold" style={{ color: BRAND.violetPale }}>
            {differPhrase(differences)}
          </strong>
          .
        </p>
      </div>

      <div>
        {onlyShown.length > 0 && (
          <>
            <p
              className="font-display"
              style={{
                fontSize: "var(--fs-body-sm)",
                fontWeight: 600,
                lineHeight: "var(--fs-body-sm-lh)",
                color: BRAND.violetPale,
              }}
            >
              {INDEX_UI.onlyCleanStart}
            </p>
            <ul className="mt-2.5 grid gap-2">
              {onlyShown.map((row) => (
                <li
                  key={row.id}
                  className="flex items-baseline gap-2.5"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body-sm)",
                    lineHeight: "var(--fs-body-sm-lh)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {/* The legend's own square as the marker, so the list and
                      the fingerprint read as one key. */}
                  <span className="translate-y-px">
                    <Cell state="only" size={10} />
                  </span>
                  {row.capability}
                </li>
              ))}
              {onlyRest > 0 && (
                <li
                  className="pl-5"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    lineHeight: "var(--fs-caption-lh)",
                    color: "rgba(255,255,255,0.5)",
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
        className="inline-flex items-center gap-2.5 font-display text-white lg:justify-self-end"
        style={{
          fontSize: "var(--fs-button-sm)",
          fontWeight: "var(--fs-button-weight)",
          letterSpacing: "var(--fs-button-ls)",
        }}
      >
        <span className="lg:sr-only">{INDEX_UI.rowCta}</span>
        <span className="grid size-10 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-1 group-hover/row:bg-white group-hover/row:text-[#1B1F4F] group-focus-within/row:bg-white group-focus-within/row:text-[#1B1F4F] lg:size-12">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8h9M9 4.5 12.5 8 9 11.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </article>
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
 * The hub's dark frame: the hero and the ledger on one continuous band.
 *
 * They are one section of the page, not two: the legend and the squares it
 * explains belong in the same room, and the first comparison lands inside the
 * opening viewport, where the previous hero spent that space on a button that
 * led away from the page.
 *
 * No call to action in the hero for the same reason: the rows are the action.
 * The route closes on the footer's CTA card instead.
 */
export function CompareIndexLedger({
  copy,
  comparisons,
}: {
  copy: CompareIndexCopy;
  comparisons: readonly CompareContent[];
}): React.ReactElement {
  return (
    <section
      data-section="CompareIndexLedger"
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

        {/* The key sits on the ledger it explains, not up in the hero. */}
        <div className="mt-12 lg:mt-16">
          <Legend />
        </div>

        {/* A shell and a core, concentric. The shell is the band showing
            through a hairline tray; the core is opaque navy, so the gradient
            behind it does not wash the squares. No backdrop blur: this is a
            tall scrolling surface, and a blur here repaints on every frame. */}
        <div
          className="mt-5 p-1.5"
          style={{
            borderRadius: "30px",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)",
          }}
        >
          <RevealStagger
            className="overflow-hidden"
            style={{
              borderRadius: "24px",
              background: [
                "radial-gradient(70% 60% at 12% 0%, rgba(106,61,240,0.16) 0%, rgba(106,61,240,0) 70%)",
                "linear-gradient(180deg, rgba(13,17,50,0.9) 0%, rgba(8,11,36,0.96) 100%)",
              ].join(", "),
              boxShadow: [
                "0 40px 100px -48px rgba(0,0,0,0.8)",
                "inset 0 1px 0 rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {comparisons.map((content, index) => (
              <RevealItem
                key={content.path}
                className={
                  index === 0 ? undefined : "border-t border-[rgba(255,255,255,0.08)]"
                }
              >
                <LedgerRow content={content} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
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
