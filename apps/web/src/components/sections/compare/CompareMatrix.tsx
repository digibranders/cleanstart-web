import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import {
  KEY_TAKEAWAY,
  KEY_TAKEAWAY_LABEL,
  MATRIX_HEADING,
  MATRIX_ROWS,
  UI_CHROME,
  VENDOR_CLEANSTART,
  VENDOR_DHI,
  type MatrixRow,
} from "./compare-data";
import { RULE } from "./compare-editorial";

/**
 * The capability comparison, rendered flat — header plus fifteen rows — because
 * that is exactly what the source document's table is. See the note in
 * compare-data.ts on why the category bands were removed.
 */

const CLEANSTART_TINT = "rgba(106, 61, 240, 0.035)";

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
        {/* Section Heading — Pure H2 without eyebrow kicker */}
        <Reveal header>
          <h2
            id="compare-matrix-title"
            className="font-display text-slate-900 font-bold mb-8 md:mb-10"
            style={{
              fontSize: "var(--fs-h2)",
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
              maxWidth: "24ch",
              textWrap: "balance",
            }}
          >
            {MATRIX_HEADING}
          </h2>
        </Reveal>

        {/* Matrix Table */}
        <Reveal className="overflow-x-auto md:overflow-x-visible">
          <table
            className="w-full min-w-[580px] border-separate sm:min-w-[660px] md:min-w-0"
            style={{ borderSpacing: 0 }}
          >
            <caption className="sr-only">{UI_CHROME.matrixCaption}</caption>

            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 top-[var(--cs-header-h)] z-30 w-[188px] bg-white text-left align-bottom sm:w-[240px] md:left-auto md:w-[44%]"
                  style={{ padding: "0 clamp(16px, 1.5vw, 24px) clamp(16px, 1.6vw, 24px) 0" }}
                >
                  <span className="sr-only">Capability</span>
                </th>
                <VendorColumnHead
                  label={VENDOR_DHI}
                  logo="/images/cleanstart-images/workflows-docker.webp"
                />
                <VendorColumnHead
                  label={VENDOR_CLEANSTART}
                  logo="/images/security/cs-logomark.svg"
                  branded
                />
              </tr>
            </thead>

            <tbody>
              {MATRIX_ROWS.map((row) => (
                <MatrixTableRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </Reveal>

        {/* Legend & Trademark Footer */}
        <Reveal
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10"
          style={{ borderTop: RULE, paddingTop: "clamp(16px, 1.4vw, 22px)" }}
        >
          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                <Tick stroke="#FFFFFF" />
              </span>
              <span className="font-medium text-slate-900">{UI_CHROME.legendIncluded}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200">
                —
              </span>
              <span>{UI_CHROME.legendAbsent}</span>
            </span>
          </div>
        </Reveal>

        {/* Sleek Light Studio Executive Takeaway Card */}
        <Reveal className="mt-14 md:mt-20">
          <div className="relative overflow-hidden rounded-2xl bg-[#F9F8FE] border border-purple-200/90 p-7 sm:p-9 md:p-10 shadow-xs">
            {/* Soft subtle radial ambient glow in top right */}
            <div
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-40 blur-2xl"
              style={{ background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(255, 255, 255, 0) 70%)" }}
            />

            <div className="flex flex-col gap-4 relative z-10">
              {/*
               * The document prefixes this paragraph "Key takeaway:" — real
               * sourced text, so it replaces the decorative quote glyph that
               * previously sat here.
               */}
              <span
                className="font-sans font-semibold text-[#6d28d9]"
                style={{
                  fontSize: "var(--fs-caption)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {KEY_TAKEAWAY_LABEL}
              </span>

              <blockquote
                className="font-display text-slate-900 text-pretty"
                style={{
                  fontSize: "var(--fs-h3)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-h3-ls)",
                  lineHeight: "var(--fs-h3-lh)",
                }}
              >
                {KEY_TAKEAWAY}
              </blockquote>

            </div>
          </div>
        </Reveal>

      </Container>
    </Section>
  );
}

/** Vendor Column Header */
function VendorColumnHead({
  label,
  logo,
  branded = false,
}: {
  label: string;
  /** The vendor's own mark. On a page that names a competitor, the real logo
   *  is both more legible and more honest than a stand-in glyph. */
  logo: string;
  branded?: boolean;
}): React.ReactElement {
  return (
    <th
      scope="col"
      className={`sticky top-[var(--cs-header-h)] z-30 w-[168px] overflow-hidden text-left align-bottom sm:w-[200px] md:w-[28%] ${
        branded ? "cs-cmp-cleanstart-header" : "cs-cmp-public-header"
      }`}
      style={{
        padding: "clamp(16px, 1.6vw, 24px) clamp(12px, 1.2vw, 20px)",
        borderRadius: "12px 12px 0 0",
        ...(branded
          ? {
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
            }
          : {
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            }),
      }}
    >
      <div className="flex flex-row items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{
            background: branded ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt=""
            aria-hidden
            className="pointer-events-none select-none"
            style={{ width: 18, height: 18, objectFit: "contain" }}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span
          className="block font-display text-white font-bold text-base sm:text-lg leading-snug"
          style={{ textWrap: "balance" }}
        >
          {label}
        </span>
      </div>
    </th>
  );
}

/** Matrix Table Row */
function MatrixTableRow({ row }: { row: MatrixRow }): React.ReactElement {
  const emphasised = row.divergent === true;
  const padY = emphasised ? "clamp(16px, 1.5vw, 22px)" : "clamp(12px, 1.1vw, 16px)";

  return (
    <tr className={`transition-colors duration-150 ${emphasised ? "bg-purple-50/20" : "hover:bg-slate-50/50"}`}>
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white text-left align-middle md:static md:z-auto"
        style={{ padding: `${padY} clamp(16px, 1.5vw, 24px) ${padY} 0`, borderTop: RULE }}
      >
        <span
          className={`text-slate-900 ${emphasised ? "font-semibold text-sm sm:text-base text-purple-950" : "font-normal text-xs sm:text-sm text-slate-800"}`}
          style={{
            fontFamily: "var(--font-sans)",
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
          }}
        >
          {row.capability}
        </span>
      </th>
      <MatrixCell cell={row.docker} padY={padY} isCleanStart={false} />
      <MatrixCell cell={row.cleanstart} padY={padY} isCleanStart={true} />
    </tr>
  );
}

/** Matrix Table Cell */
function MatrixCell({
  cell,
  padY,
  isCleanStart = false,
}: {
  cell: MatrixRow["docker"] | MatrixRow["cleanstart"];
  padY: string;
  isCleanStart?: boolean;
}): React.ReactElement {
  return (
    <td
      className="align-middle"
      style={{
        padding: `${padY} clamp(12px, 1.2vw, 20px)`,
        borderTop: RULE,
        ...(isCleanStart
          ? {
              background: CLEANSTART_TINT,
              borderRight: "1px solid rgba(154, 81, 255, 0.1)",
              borderLeft: "1px solid rgba(154, 81, 255, 0.06)",
            }
          : {}),
      }}
    >
      <div className="flex flex-col items-start gap-1.5">
        {cell.state === "yes" && !cell.note && (
          <span className="inline-flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                isCleanStart
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-[#1d4ed8] text-white"
              }`}
            >
              <Tick stroke="#FFFFFF" />
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {UI_CHROME.legendIncluded}
            </span>
          </span>
        )}

        {cell.state === "no" && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200">
            <Dash />
            <span>Not offered</span>
          </span>
        )}

        {cell.state === "yes" && cell.note && (
          <div className="flex flex-row items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                isCleanStart
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-[#1d4ed8] text-white"
              }`}
            >
              <Tick stroke="#FFFFFF" />
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                isCleanStart
                  ? "bg-purple-100 text-purple-900 border border-purple-200"
                  : "bg-blue-50 text-blue-900 border border-blue-200"
              }`}
            >
              {cell.note}
            </span>
          </div>
        )}

        {cell.state === "text" && cell.note && (
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
              isCleanStart
                ? "bg-purple-100 text-purple-950 border border-purple-200"
                : "bg-blue-50 text-blue-900 border border-blue-200"
            }`}
          >
            {cell.note}
          </span>
        )}
      </div>
    </td>
  );
}

function Tick({ stroke = "#111111" }: { stroke?: string }): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="10"
      height="10"
      viewBox="0 0 15 15"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M2.5 8L5.5 11L12.5 4"
        stroke={stroke}
        strokeWidth="2.4"
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
      width="10"
      height="10"
      viewBox="0 0 15 15"
      fill="none"
      className="shrink-0"
    >
      <path d="M3 7.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
