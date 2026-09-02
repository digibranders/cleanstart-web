import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import {
  MATRIX,
  MATRIX_ROW_COUNT,
  UI,
  VENDOR,
  type MatrixCell,
} from "./compare-data";
import { BRAND, VectorGrid } from "./compare-visuals";

/**
 * The capability matrix — the section a visitor arriving on a comparison query
 * came for, so it gets the page's widest column and its only sticky chrome.
 *
 * One DOM, two layouts. It is a real `<table>` with a caption, column headers
 * and `scope="colgroup"` group rows; below `lg` the table parts flip to
 * `display: block` and each row becomes a labelled card. Rendering a second
 * mobile copy of twenty rows would double the markup and duplicate every
 * string in the page source.
 *
 * Because that flip is a breakpoint change, every property that differs
 * between the two layouts is a class, never an inline `style` — an inline
 * declaration would win over the `max-lg:` variant and strand the mobile
 * layout with desktop padding. Inline styles here carry colour and type only.
 *
 * The CleanStart column is tinted for its full height and capped with a violet
 * rule. Twenty rows is more than the eye can track across three columns; the
 * tint is what keeps the reader in the right one.
 *
 * The document writes "✓" and "—" in some cells. Those become markers with an
 * accessible name rather than bare punctuation, so a screen reader announces
 * "Available" instead of reading a dash or skipping the glyph entirely.
 */

/** Shared padding/border rhythm for the twenty data rows. */
const CELL =
  "align-top border-b border-[rgba(17,17,17,0.06)] px-[clamp(16px,1.4vw,24px)] py-[clamp(14px,1.15vw,18px)] max-lg:block max-lg:border-0 max-lg:px-0 max-lg:py-0";

const HEAD_CELL =
  "sticky z-10 top-[calc(var(--cs-header-h)+8px)] text-left align-bottom px-[clamp(16px,1.4vw,24px)] py-[18px]";

function YesMark({
  tone,
}: {
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden
        className="inline-flex size-[20px] items-center justify-center rounded-full"
        style={{
          background: isCleanStart
            ? `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.blue})`
            : "transparent",
          border: isCleanStart ? "none" : "1.5px solid rgba(51,65,85,0.34)",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke={isCleanStart ? "#ffffff" : "rgba(51,65,85,0.72)"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="sr-only">{UI.available}</span>
    </span>
  );
}

function NoMark(): React.ReactElement {
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden
        className="block h-px w-4 rounded-full"
        style={{ background: "rgba(17,17,17,0.24)" }}
      />
      <span className="sr-only">{UI.notAvailable}</span>
    </span>
  );
}

function Cell({
  cell,
  tone,
}: {
  cell: MatrixCell;
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  if (cell.kind === "yes") return <YesMark tone={tone} />;
  if (cell.kind === "no") return <NoMark />;
  return (
    <span
      style={{
        color: tone === "cleanstart" ? "#111111" : "rgba(17,17,17,0.66)",
        fontWeight: tone === "cleanstart" ? 500 : 400,
      }}
    >
      {cell.value}
    </span>
  );
}

/**
 * Column label repeated inside every cell below `lg`, where the head is gone.
 * The CleanStart label is violet: with the column tint dropped on the card
 * layout, the label colour is the only thing left carrying the page's one
 * colour-coded axis.
 */
function CellLabel({
  children,
  tone,
}: {
  children: string;
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  return (
    <span
      aria-hidden
      className="mb-1.5 block font-display lg:hidden"
      style={{
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: tone === "cleanstart" ? BRAND.violet : "rgba(17,17,17,0.38)",
      }}
    >
      {children}
    </span>
  );
}

function HeadCell({
  vendor,
  tone,
}: {
  vendor: string;
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <th
      scope="col"
      className={HEAD_CELL}
      style={{
        // The white layer under the tint is load-bearing: the head is sticky,
        // and a translucent background would let twenty rows scroll through it.
        background: isCleanStart
          ? "linear-gradient(180deg, #ffffff 0%, rgba(106,61,240,0.07) 100%), #ffffff"
          : "#ffffff",
        borderBottom: `1px solid ${isCleanStart ? BRAND.violet : "rgba(17,17,17,0.12)"}`,
      }}
    >
      <span
        aria-hidden
        className="mb-2 block h-[3px] w-9 rounded-full"
        style={{
          background: isCleanStart
            ? `linear-gradient(90deg, ${BRAND.violet}, ${BRAND.blue})`
            : "rgba(51,65,85,0.3)",
        }}
      />
      <span
        className="block font-display"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: isCleanStart ? "#111111" : "rgba(17,17,17,0.72)",
        }}
      >
        {vendor}
      </span>
    </th>
  );
}

export function CompareMatrix(): React.ReactElement {
  const lastGroupId = MATRIX.groups[MATRIX.groups.length - 1]?.id;

  return (
    <Section padding="lg" data-section="CompareMatrix" className="bg-white">
      {/*
        * The bleed clip lives on this layer, not on the section. `overflow:
        * hidden` on the section would make it the scroll container the sticky
        * column head resolves against, and the head would stop sticking.
        */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        <VectorGrid side="right" top="-4%" edge="-14%" opacity={0.4} />
      </div>

      <Container className="relative">
        <div className="max-w-[820px]">
          <Reveal header>
            <h2
              id="capability-comparison"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              {MATRIX.heading}
            </h2>
          </Reveal>

          <Reveal delay={0.1} y={20}>
            <p
              className="mt-5"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead-sm)",
                lineHeight: 1.6,
                color: "rgba(17,17,17,0.68)",
              }}
            >
              {MATRIX.intro}
            </p>

            {/* UI chrome, not document copy — derived so it cannot drift. */}
            <p
              className="mt-6 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
              style={{
                border: "1px solid rgba(106,61,240,0.22)",
                background: "rgba(106,61,240,0.05)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                letterSpacing: "0.02em",
                color: BRAND.violet,
              }}
            >
              {MATRIX_ROW_COUNT} capabilities
              <span aria-hidden className="opacity-40">
                ·
              </span>
              {MATRIX.groups.length} categories
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} y={24} className="mt-10 lg:mt-14">
          {/*
            * `overflow: clip`, not `hidden`. Both round the table's corners, but
            * `hidden` makes this a scroll container and a scroll container is
            * what `position: sticky` resolves against — the column head would
            * silently stop sticking. `clip` does not create one.
            */}
          <div
            style={{
              borderRadius: "24px",
              overflow: "clip",
              border: "1px solid rgba(17,17,17,0.09)",
              background: "#ffffff",
              boxShadow:
                "0 1px 2px rgba(17,17,17,0.04), 0 30px 60px -46px rgba(17,17,17,0.4)",
            }}
          >
            <table
              className="w-full max-lg:block"
              style={{ borderCollapse: "separate", borderSpacing: 0 }}
            >
              <caption className="sr-only">{MATRIX.caption}</caption>

              <colgroup className="max-lg:hidden">
                <col style={{ width: "23%" }} />
                <col style={{ width: "38.5%" }} />
                <col style={{ width: "38.5%" }} />
              </colgroup>

              <thead className="max-lg:hidden">
                <tr>
                  <th
                    scope="col"
                    className={HEAD_CELL}
                    style={{
                      background: "#ffffff",
                      borderBottom: "1px solid rgba(17,17,17,0.12)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-table-th)",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "rgba(17,17,17,0.42)",
                    }}
                  >
                    Capability
                  </th>
                  <HeadCell vendor={VENDOR.docker} tone="docker" />
                  <HeadCell vendor={VENDOR.cleanstart} tone="cleanstart" />
                </tr>
              </thead>

              {MATRIX.groups.map((group) => (
                <tbody key={group.id} className="max-lg:block">
                  <tr className="max-lg:block">
                    <th
                      scope="colgroup"
                      colSpan={3}
                      className="border-y border-[rgba(17,17,17,0.08)] px-[clamp(16px,1.4vw,24px)] py-3 text-left max-lg:block"
                      style={{
                        background: "#F6F6F6",
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-table-th)",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(17,17,17,0.55)",
                      }}
                    >
                      {group.label}
                    </th>
                  </tr>

                  {group.rows.map((row, rowIndex) => {
                    const isFinalRow =
                      group.id === lastGroupId &&
                      rowIndex === group.rows.length - 1;
                    // The card's own border already draws this line; a cell
                    // border here would double it.
                    const edge = isFinalRow ? " border-b-0" : "";

                    return (
                      <tr
                        key={row.id}
                        className="max-lg:block max-lg:border-b max-lg:border-[rgba(17,17,17,0.08)] max-lg:px-5 max-lg:py-5 max-lg:last:border-b-0"
                      >
                        <th
                          scope="row"
                          className={`${CELL}${edge} text-left`}
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontWeight: 600,
                            lineHeight: 1.45,
                            color: "#111111",
                          }}
                        >
                          <span className="text-[var(--fs-body)] lg:text-[var(--fs-body-sm)]">
                            {row.capability}
                          </span>
                        </th>

                        <td
                          className={`${CELL}${edge} max-lg:pt-4 text-[var(--fs-body)] lg:text-[var(--fs-table-td)]`}
                          style={{
                            fontFamily: "var(--font-sans)",
                            lineHeight: 1.5,
                          }}
                        >
                          <CellLabel tone="docker">{VENDOR.docker}</CellLabel>
                          <Cell cell={row.docker} tone="docker" />
                        </td>

                        <td
                          className={`${CELL}${edge} max-lg:pt-4 bg-[rgba(106,61,240,0.035)] max-lg:bg-transparent text-[var(--fs-body)] lg:text-[var(--fs-table-td)]`}
                          style={{
                            fontFamily: "var(--font-sans)",
                            lineHeight: 1.5,
                          }}
                        >
                          <CellLabel tone="cleanstart">{VENDOR.cleanstart}</CellLabel>
                          <Cell cell={row.cleanstart} tone="cleanstart" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        </Reveal>

        <Reveal delay={0.1} y={16}>
          <p
            className="mt-5 max-w-[780px]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              lineHeight: "var(--fs-caption-lh)",
              color: "rgba(17,17,17,0.45)",
            }}
          >
            {MATRIX.footnote}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
