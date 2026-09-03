"use client";

import { useMemo, useState } from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import {
  MATRIX,
  UI,
  VENDOR,
  type MatrixCell,
  type MatrixGroup,
  type MatrixRow,
} from "./compare-data";
import { BandHeader, BRAND, Icon3D, VectorGrid, VendorMark } from "./compare-visuals";

/**
 * The capability matrix, the section a visitor arriving on a comparison query
 * came for. It gets the page's widest column, its only sticky chrome and its
 * only controls.
 *
 * One DOM, two layouts. It is a real `<table>` with a caption, column headers
 * and `scope="colgroup"` group rows; below `lg` the table parts flip to
 * `display: block` and each row becomes a card. Rendering a second mobile
 * copy of twenty rows would double the markup and duplicate every string.
 *
 * Because that flip is a breakpoint change, every property that differs
 * between the two layouts is a class, never an inline `style`. Inline styles
 * here carry colour and type only.
 *
 * Wayfinding for twenty rows: the four group rows open as chapters (3D icon
 * plus label) and stick under the column head while their rows scroll; a
 * chapter index above the table jumps to each; and a "differences only"
 * switch hides the rows where the document gives both vendors the same
 * answer. Hidden rows stay in the DOM, so the page source and the table a
 * crawler reads are unchanged.
 *
 * Both vendors get the same check glyph. The earlier outlined-vs-filled pair
 * read as "partial" against "full" on rows where the document says both are
 * available; the CleanStart column's tint is what carries "our side".
 */

const HEAD_H = 84;

const CELL =
  "align-top border-b border-[rgba(17,17,17,0.06)] px-[clamp(16px,1.5vw,26px)] py-[clamp(14px,1.2vw,19px)] max-lg:block max-lg:border-0 max-lg:px-0 max-lg:py-0";

const HEAD_CELL =
  "sticky z-20 top-[calc(var(--cs-header-h)+8px)] text-left align-bottom px-[clamp(16px,1.5vw,26px)] py-[18px]";

const GROUP_CELL =
  "lg:sticky lg:z-10 lg:top-[calc(var(--cs-header-h)+8px+84px)] border-y border-[rgba(17,17,17,0.08)] px-[clamp(16px,1.5vw,26px)] py-3 text-left max-lg:block max-lg:border-0 max-lg:px-0 max-lg:pb-3 max-lg:pt-8";

function YesMark({ tone }: { tone: "docker" | "cleanstart" }): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden
        className="inline-flex size-[22px] items-center justify-center rounded-full"
        style={{
          background: isCleanStart
            ? `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.blue})`
            : BRAND.slate,
          boxShadow: isCleanStart ? "0 6px 14px -8px rgba(106,61,240,0.8)" : "none",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="#ffffff"
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
    <span className="inline-flex h-[22px] items-center">
      <span
        aria-hidden
        className="block h-[2px] w-[18px] rounded-full"
        style={{ background: "rgba(17,17,17,0.22)" }}
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
      className="block max-w-[44ch]"
      style={{
        color: tone === "cleanstart" ? "#111111" : "rgba(17,17,17,0.74)",
        fontWeight: tone === "cleanstart" ? 500 : 400,
      }}
    >
      {cell.value}
    </span>
  );
}

/** Column label repeated inside every cell below `lg`, where the head is gone. */
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
      className="mb-2 flex items-center gap-2 font-display lg:hidden"
      style={{
        fontSize: "var(--fs-badge)",
        fontWeight: "var(--fs-badge-weight)",
        letterSpacing: "var(--fs-badge-ls)",
        textTransform: "uppercase",
        color: tone === "cleanstart" ? BRAND.violet : "rgba(17,17,17,0.42)",
      }}
    >
      <VendorMark tone={tone} size={22} />
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
        height: HEAD_H,
        // The opaque layer under the tint is load-bearing: the head is sticky
        // and twenty rows scroll through it.
        background: isCleanStart
          ? "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)"
          : "#ffffff",
        borderBottom: `1px solid ${isCleanStart ? BRAND.violet : "rgba(17,17,17,0.12)"}`,
      }}
    >
      <span className="flex items-center gap-3">
        <VendorMark tone={tone} />
        <span
          className="block font-display"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: 600,
            letterSpacing: "var(--fs-h4-ls)",
            color: isCleanStart ? "#ffffff" : "#111111",
          }}
        >
          {vendor}
        </span>
      </span>
    </th>
  );
}

function isSame(row: MatrixRow): boolean {
  if (row.docker.kind !== row.cleanstart.kind) return false;
  if (row.docker.kind === "text" && row.cleanstart.kind === "text") {
    return row.docker.value === row.cleanstart.value;
  }
  return true;
}

function GroupRow({ group }: { group: MatrixGroup }): React.ReactElement {
  return (
    <tr className="max-lg:block">
      <th
        scope="colgroup"
        colSpan={3}
        id={`matrix-${group.id}`}
        className={`${GROUP_CELL} scroll-mt-[calc(var(--cs-header-h)+100px)]`}
        style={{ background: "#FAFAFC" }}
      >
        <span className="flex items-center gap-3">
          <Icon3D src={group.icon} size={40} bloom={false} />
          <span
            className="font-display"
            style={{
              fontSize: "var(--fs-h5)",
              fontWeight: "var(--fs-h5-weight)",
              letterSpacing: "var(--fs-h5-ls)",
              lineHeight: "var(--fs-h5-lh)",
              color: "#111111",
            }}
          >
            {group.label}
          </span>
        </span>
      </th>
    </tr>
  );
}

function DataRow({
  row,
  hidden,
  isFinal,
}: {
  row: MatrixRow;
  hidden: boolean;
  isFinal: boolean;
}): React.ReactElement {
  // The card's own border already draws the last line; a cell border here
  // would double it.
  const edge = isFinal ? " border-b-0" : "";
  return (
    <tr
      hidden={hidden}
      className="group max-lg:mb-3 max-lg:block max-lg:rounded-[16px] max-lg:border max-lg:border-[rgba(17,17,17,0.08)] max-lg:bg-white max-lg:px-5 max-lg:py-5"
    >
      <th
        scope="row"
        className={`${CELL}${edge} text-left transition-colors lg:group-hover:bg-[rgba(17,17,17,0.03)]`}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-table-td)",
          fontWeight: 600,
          lineHeight: "var(--fs-body-sm-lh)",
          letterSpacing: "var(--fs-body-ls)",
          color: "#111111",
        }}
      >
        {row.capability}
      </th>

      <td
        className={`${CELL}${edge} transition-colors max-lg:pt-4 lg:group-hover:bg-[rgba(17,17,17,0.03)]`}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-table-td)",
          lineHeight: "var(--fs-body-sm-lh)",
        }}
      >
        <CellLabel tone="docker">{VENDOR.docker}</CellLabel>
        <Cell cell={row.docker} tone="docker" />
      </td>

      <td
        className={`${CELL}${edge} bg-[rgba(106,61,240,0.055)] transition-colors max-lg:bg-transparent max-lg:pt-4 lg:border-l lg:border-l-[rgba(106,61,240,0.16)] lg:group-hover:bg-[rgba(106,61,240,0.1)]`}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-table-td)",
          lineHeight: "var(--fs-body-sm-lh)",
        }}
      >
        <CellLabel tone="cleanstart">{VENDOR.cleanstart}</CellLabel>
        <Cell cell={row.cleanstart} tone="cleanstart" />
      </td>
    </tr>
  );
}

export function CompareMatrix(): React.ReactElement {
  const [diffOnly, setDiffOnly] = useState(false);

  const differenceCount = useMemo(
    () =>
      MATRIX.groups.reduce(
        (total, group) => total + group.rows.filter((row) => !isSame(row)).length,
        0,
      ),
    [],
  );

  const lastGroup = MATRIX.groups[MATRIX.groups.length - 1];
  const lastVisibleRowId = (() => {
    for (let g = MATRIX.groups.length - 1; g >= 0; g -= 1) {
      const rows = MATRIX.groups[g]?.rows ?? [];
      for (let r = rows.length - 1; r >= 0; r -= 1) {
        const row = rows[r];
        if (row && (!diffOnly || !isSame(row))) return row.id;
      }
    }
    return lastGroup?.rows[lastGroup.rows.length - 1]?.id;
  })();

  return (
    <Section padding="lg" data-section="CompareMatrix" className="bg-white">
      {/* The bleed clip lives on this layer, not on the section: `overflow:
          hidden` on the section would become the scroll container the sticky
          head resolves against, and the head would stop sticking. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        <VectorGrid side="right" top="-4%" edge="-14%" opacity={0.4} />
      </div>

      <Container className="relative">
        <BandHeader
          id="capability-comparison"
          heading={MATRIX.heading}
          intro={MATRIX.intro}
        />

        {/* Controls: chapter index on the left, the differences switch on the
            right. UI chrome, not document copy. */}
        <Reveal delay={0.12} y={16}>
          <div className="mt-8 flex flex-col gap-4 lg:mt-10 lg:flex-row lg:items-center lg:justify-between">
            <nav
              aria-label={UI.groupIndex}
              className="flex flex-wrap items-center gap-2"
            >
              <span
                className="mr-1 font-display"
                style={{
                  fontSize: "var(--fs-eyebrow)",
                  fontWeight: "var(--fs-eyebrow-weight)",
                  letterSpacing: "var(--fs-eyebrow-ls)",
                  textTransform: "uppercase",
                  color: "rgba(17,17,17,0.5)",
                }}
              >
                {UI.groupIndex}
              </span>
              {MATRIX.groups.map((group) => (
                <a
                  key={group.id}
                  href={`#matrix-${group.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 transition-colors hover:border-[rgba(106,61,240,0.4)] hover:bg-[rgba(106,61,240,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC]"
                  style={{
                    border: "1px solid rgba(17,17,17,0.1)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-button-sm)",
                    fontWeight: "var(--fs-button-weight)",
                    letterSpacing: "var(--fs-button-ls)",
                    color: "#111111",
                  }}
                >
                  <Icon3D src={group.icon} size={22} bloom={false} />
                  {group.label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              aria-pressed={diffOnly}
              onClick={() => setDiffOnly((value) => !value)}
              className="inline-flex cursor-pointer items-center gap-3 self-start rounded-full py-1.5 pl-1.5 pr-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC] lg:self-auto"
              style={{
                border: `1px solid ${diffOnly ? "rgba(106,61,240,0.45)" : "rgba(17,17,17,0.1)"}`,
                background: diffOnly ? "rgba(106,61,240,0.06)" : "#ffffff",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-button-sm)",
                fontWeight: "var(--fs-button-weight)",
                letterSpacing: "var(--fs-button-ls)",
                color: "#111111",
              }}
            >
              <span
                aria-hidden
                className="relative block h-6 w-11 rounded-full transition-colors"
                style={{
                  background: diffOnly
                    ? `linear-gradient(90deg, ${BRAND.violet}, ${BRAND.blue})`
                    : "rgba(17,17,17,0.14)",
                }}
              >
                <span
                  className="absolute top-[3px] block size-[18px] rounded-full bg-white transition-transform"
                  style={{
                    left: "3px",
                    transform: diffOnly ? "translateX(20px)" : "translateX(0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  }}
                />
              </span>
              <span className="whitespace-nowrap">{UI.differencesOnly}</span>
              <span
                className="rounded-full px-2 py-[2px]"
                style={{
                  fontSize: "var(--fs-badge)",
                  fontWeight: "var(--fs-badge-weight)",
                  background: diffOnly ? BRAND.violet : "rgba(17,17,17,0.06)",
                  color: diffOnly ? "#ffffff" : "rgba(17,17,17,0.6)",
                }}
              >
                {differenceCount}
              </span>
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.15} y={24} className="mt-6 lg:mt-8">
          {/* `overflow: clip`, not `hidden`: both round the corners, but `hidden`
              creates a scroll container, which is what `position: sticky`
              resolves against, and the head would silently stop sticking. */}
          <div
            className="max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none"
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
                <col style={{ width: "24%" }} />
                <col style={{ width: "38%" }} />
                <col style={{ width: "38%" }} />
              </colgroup>

              <thead className="max-lg:hidden">
                <tr>
                  <th
                    scope="col"
                    className={HEAD_CELL}
                    style={{
                      height: HEAD_H,
                      background: "#ffffff",
                      borderBottom: "1px solid rgba(17,17,17,0.12)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-table-th)",
                      fontWeight: "var(--fs-eyebrow-weight)",
                      letterSpacing: "var(--fs-eyebrow-ls)",
                      textTransform: "uppercase",
                      color: "rgba(17,17,17,0.55)",
                    }}
                  >
                    {UI.capability}
                  </th>
                  <HeadCell vendor={VENDOR.docker} tone="docker" />
                  <HeadCell vendor={VENDOR.cleanstart} tone="cleanstart" />
                </tr>
              </thead>

              {MATRIX.groups.map((group) => {
                const groupHidden =
                  diffOnly && group.rows.every((row) => isSame(row));
                return (
                  <tbody key={group.id} className="max-lg:block" hidden={groupHidden}>
                    <GroupRow group={group} />
                    {group.rows.map((row) => (
                      <DataRow
                        key={row.id}
                        row={row}
                        hidden={diffOnly && isSame(row)}
                        isFinal={row.id === lastVisibleRowId}
                      />
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        </Reveal>

        <Reveal delay={0.1} y={16}>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <p
              className="max-w-[720px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                lineHeight: "var(--fs-caption-lh)",
                color: "rgba(17,17,17,0.62)",
              }}
            >
              {MATRIX.footnote}
            </p>
            <dl
              className="flex shrink-0 items-center gap-5"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "rgba(17,17,17,0.62)",
              }}
            >
              <div className="flex items-center gap-2">
                <dt className="flex items-center gap-1">
                  <YesMark tone="docker" />
                  <YesMark tone="cleanstart" />
                </dt>
                <dd>{UI.legendAvailable}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt>
                  <NoMark />
                </dt>
                <dd>{UI.legendNotAvailable}</dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
