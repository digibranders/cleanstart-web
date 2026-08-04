import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import {
  INTRO_BODY,
  KEY_TAKEAWAY,
  KEY_TAKEAWAY_LABEL,
  MATRIX_HEADING,
  MATRIX_ROWS,
  UI_CHROME,
  VENDOR_CLEANSTART,
  VENDOR_DHI,
  type MatrixRow,
} from "./compare-data";
import { P, PullQuote, RULE } from "./compare-editorial";
import { Glyph, type GlyphKey } from "./compare-visuals";

/**
 * The comparison table.
 *
 * No card: no outer border, radius, shadow, or gradient header strip. The table
 * sits directly on the page and is held together by hairline rules and one
 * tinted column, so it reads as typeset data rather than as a widget. Column
 * identity persists via that tint rather than a sticky header.
 *
 * Rows the article qualifies get a slightly heavier label and a top rule at
 * full strength; the twelve unqualified rows stay deliberately quiet. The break
 * is carried by weight and spacing alone — the article supplies no band labels,
 * so none are invented here.
 *
 * On mobile it scrolls horizontally with the capability column pinned; column
 * widths are fixed px below md so the pinned column always leaves room for a
 * whole vendor column beside it (188 + 168 = 356 inside a 390 px viewport).
 */

const CLEANSTART_TINT = "rgba(154, 81, 255, 0.04)";

export function CompareMatrix(): React.ReactElement {
  return (
    <Section
      data-section="CompareMatrix"
      padding="md"
      id="capability-matrix"
      className="scroll-mt-[calc(var(--cs-header-h)_+_24px)] bg-white"
      aria-labelledby="compare-matrix-title"
    >
      <Container>
        <Reveal className="mb-10 flex flex-col gap-4 md:mb-14">
          {INTRO_BODY.map((text) => (
            <P key={text}>{text}</P>
          ))}
        </Reveal>

        <Reveal header>
          <h2
            id="compare-matrix-title"
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
              maxWidth: "24ch",
              textWrap: "balance",
              marginBottom: "clamp(24px, 2.4vw, 40px)",
            }}
          >
            {MATRIX_HEADING}
          </h2>
        </Reveal>

        <Reveal className="overflow-x-auto md:overflow-x-visible">
          <table
            className="w-full min-w-[524px] border-separate sm:min-w-[640px] md:min-w-0"
            style={{ borderSpacing: 0 }}
          >
            <caption className="sr-only">{UI_CHROME.matrixCaption}</caption>

            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-20 w-[188px] bg-white text-left align-bottom sm:w-[240px] md:static md:z-auto md:w-[46%]"
                  style={{ padding: "0 clamp(16px, 1.5vw, 24px) 0 0" }}
                >
                  <span className="sr-only">Capability</span>
                </th>
                <VendorColumnHead label={VENDOR_DHI} icon="image" />
                <VendorColumnHead label={VENDOR_CLEANSTART} icon="build" branded />
              </tr>
            </thead>

            <tbody>
              {MATRIX_ROWS.map((row) => (
                <MatrixTableRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10"
          style={{ borderTop: RULE, paddingTop: "clamp(14px, 1.3vw, 20px)" }}
        >
          <p
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#6B6B6B]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              letterSpacing: "-0.01em",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Tick />
              {UI_CHROME.legendIncluded}
            </span>
            <span className="inline-flex items-center gap-2">
              <Dash />
              {UI_CHROME.legendAbsent}
            </span>
          </p>
          <p
            className="text-[#6B6B6B]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              lineHeight: 1.5,
              maxWidth: "52ch",
            }}
          >
            {UI_CHROME.trademark}
          </p>
        </Reveal>

        <div
          className="mt-14 md:mt-20"
          style={{ borderTop: RULE, paddingTop: "clamp(28px, 3vw, 48px)" }}
        >
          <Reveal>
            <p
              className="mb-4 text-[#6B6B6B]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-body-sm)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {KEY_TAKEAWAY_LABEL}
            </p>
          </Reveal>
          <PullQuote>{KEY_TAKEAWAY}</PullQuote>
        </div>
      </Container>
    </Section>
  );
}

/**
 * Vendor column header. The two gradient strips are the site's existing
 * comparison-header treatment (`.cs-cmp-public-header` /
 * `.cs-cmp-cleanstart-header`), which anchors the top of the table without
 * wrapping the whole thing in a card. `text-left` is load-bearing: <th> centres
 * by default, which would offset every header from the glyph column beneath it.
 */
function VendorColumnHead({
  label,
  icon,
  branded = false,
}: {
  label: string;
  icon: GlyphKey;
  branded?: boolean;
}): React.ReactElement {
  return (
    <th
      scope="col"
      className={`w-[168px] overflow-hidden text-left align-bottom sm:w-[200px] md:w-[27%] ${
        branded ? "cs-cmp-cleanstart-header" : "cs-cmp-public-header"
      }`}
      style={{
        padding: "clamp(16px, 1.6vw, 24px) clamp(12px, 1.2vw, 20px)",
        borderRadius: "14px 14px 0 0",
        ...(branded
          ? { boxShadow: "inset 1px 0 0 rgba(255,255,255,0.14)" }
          : {}),
      }}
    >
      <span className="flex flex-col items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] text-white"
          style={{
            background: "rgba(255,255,255,0.12)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
          }}
        >
          <Glyph icon={icon} size={18} />
        </span>
        <span
          className="block font-display text-white"
          style={{
            fontSize: "var(--fs-h5)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            textWrap: "balance",
          }}
        >
          {label}
        </span>
      </span>
    </th>
  );
}

function MatrixTableRow({ row }: { row: MatrixRow }): React.ReactElement {
  const emphasised = row.divergent === true;
  const padY = emphasised
    ? "clamp(18px, 1.7vw, 26px)"
    : "clamp(13px, 1.2vw, 18px)";
  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white text-left align-middle md:static md:z-auto"
        style={{ padding: `${padY} clamp(16px, 1.5vw, 24px) ${padY} 0`, borderTop: RULE }}
      >
        <span
          className="text-[#111111]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-table-td)",
            fontWeight: emphasised ? 600 : 400,
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
          }}
        >
          {row.capability}
        </span>
      </th>
      <MatrixCell cell={row.docker} padY={padY} />
      <MatrixCell cell={row.cleanstart} padY={padY} tinted />
    </tr>
  );
}

function MatrixCell({
  cell,
  padY,
  tinted = false,
}: {
  cell: MatrixRow["docker"];
  padY: string;
  tinted?: boolean;
}): React.ReactElement {
  return (
    <td
      className="align-middle"
      style={{
        padding: `${padY} clamp(12px, 1.2vw, 20px)`,
        borderTop: RULE,
        ...(tinted ? { background: CLEANSTART_TINT } : {}),
      }}
    >
      <span className="flex flex-col items-start gap-1.5">
        {cell.state === "yes" && (
          <>
            <Tick />
            <span className="sr-only">{UI_CHROME.legendIncluded}</span>
          </>
        )}
        {cell.state === "no" && (
          <>
            <Dash />
            <span className="sr-only">{UI_CHROME.legendAbsent}</span>
          </>
        )}
        {cell.note && (
          <span
            className="text-[#4A4A4A]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}
          >
            {cell.note}
          </span>
        )}
      </span>
    </td>
  );
}

/** Bare check glyph — no disc, no fill, no gradient. */
function Tick(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M2 7.9 5.6 11.5 13 3.6"
        stroke="#111111"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dash(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      className="shrink-0"
    >
      <path d="M3 7.5h9" stroke="#8A8A8A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
