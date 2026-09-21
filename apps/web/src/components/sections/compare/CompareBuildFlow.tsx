import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { ScaleToFit } from "@/components/ui/ScaleToFit";
import type {
  BuildFlowColumn,
  BuildFlowSection,
  CompareTone,
  InheritedBase,
} from "./compare-types";
import { StageGlyph } from "./compare-glyphs";
import {
  BAND_DARK,
  BandHeader,
  BRAND,
  DarkPanel,
  EllipseGlow,
  HexOutline,
  VendorMark,
} from "./compare-visuals";

/**
 * The build-process band: both approaches as lanes running to one gate.
 *
 * Both build approaches in the source document end at the same stage, so the
 * diagram gives them ONE destination: a gate at the right edge that both lanes
 * run into. Where the document gives the rival fewer stages than CleanStart,
 * its lane starts further right and the stages it skips are drawn as a dashed
 * ghost (`inheritedBase`) — that is the comparison, made visible. Where both
 * lanes are the same length they simply run in parallel. A light pulse travels
 * each lane on a shared six-second clock, lighting every stage as it passes,
 * and both pulses reach the gate together. Everything is CSS, and all of it
 * stops under `prefers-reduced-motion`, leaving the static lanes.
 *
 * The diagram is laid out once at a fixed width and scaled uniformly to the
 * panel from `lg` up (the home page's pipeline does the same), so it never
 * reflows into a different composition. Descriptions and key characteristics
 * sit beneath it in two columns at real type size. Below `lg` the diagram is
 * not rendered; each vendor becomes a plain vertical list with "Production
 * Deployment" back in its own list.
 */

/**
 * Lane geometry, derived from the content rather than fixed: the longer of the
 * two lanes sets how many stage columns the grid has, and a shorter lane is
 * pushed right by the difference. Hard-coding six columns worked while every
 * document drew at most six on-lane stages; a seventh put a stage in column
 * zero and off the grid.
 *
 * The last step in a lane is the destination both share and is drawn as the
 * gate, so it does not take a column.
 */
interface LaneGeometry {
  /** Stage columns on the lanes; the final stage is the shared gate. */
  readonly cols: number;
  /** Seconds per column; a pulse covers them all in 60% of the period. */
  readonly step: number;
  /** Natural width the diagram is composed at; ScaleToFit shrinks it to fit. */
  readonly width: number;
}

const PERIOD = 6;
/** Width per stage column, held constant so a longer flow gets a wider canvas
 *  rather than narrower labels. Tuned on the six-column Docker diagram. */
const COL_W = 130;
/** The vendor-name and gate columns either side of the lanes, plus their gaps. */
const DIAGRAM_CHROME_W = 1160 - 6 * COL_W;

function laneGeometry(columns: BuildFlowSection["columns"]): LaneGeometry {
  const cols = Math.max(
    ...columns.map((column) => Math.max(column.steps.length - 1, 1)),
  );
  return {
    cols,
    step: (PERIOD * 0.6) / cols,
    width: DIAGRAM_CHROME_W + cols * COL_W,
  };
}

/** Tile centre line, matching the lane line's `top`. */
const TILE = 40;

function Stage({
  label,
  tone,
  hitAt,
  align = "center",
}: {
  label: string;
  tone: CompareTone;
  hitAt: number;
  /** Centred under its tile in the wide diagram; beside it in the stacked list,
   *  where a centred two-line label sits out of line with its neighbours. */
  align?: "center" | "start";
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <>
      <span
        className="relative flex shrink-0 items-center justify-center rounded-[12px]"
        style={{
          width: TILE,
          height: TILE,
          background: isCleanStart ? "rgba(106,61,240,0.34)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${
            isCleanStart ? "rgba(169,116,255,0.6)" : "rgba(255,255,255,0.18)"
          }`,
          boxShadow: isCleanStart
            ? "inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 24px -16px rgba(106,61,240,0.9)"
            : "inset 0 1px 0 rgba(255,255,255,0.06)",
          color: isCleanStart ? "#E9DDFF" : "rgba(255,255,255,0.82)",
        }}
      >
        <span
          aria-hidden
          className="cs-stage-hit pointer-events-none absolute inset-0 rounded-[12px]"
          style={
            {
              "--hit": `${hitAt}s`,
              background: isCleanStart ? "rgba(130,225,255,0.28)" : "rgba(255,255,255,0.22)",
              boxShadow: isCleanStart
                ? "0 0 22px 4px rgba(130,225,255,0.45)"
                : "0 0 18px 3px rgba(255,255,255,0.25)",
              opacity: 0,
            } as React.CSSProperties
          }
        />
        <StageGlyph name={label} size={20} className="relative" />
      </span>
      <span
        className={`font-display ${align === "center" ? "text-center" : "text-left"}`}
        style={{
          fontSize: "var(--fs-body-sm)",
          fontWeight: 500,
          letterSpacing: "var(--fs-body-ls)",
          lineHeight: "var(--fs-body-sm-lh)",
          color: isCleanStart ? "#ffffff" : "rgba(255,255,255,0.84)",
          ...(align === "center" ? { textWrap: "balance" as const } : {}),
        }}
      >
        {label}
      </span>
    </>
  );
}

/**
 * The base the rival inherits, drawn as a dashed ghost tile ahead of the
 * lane's first stage. It is why that lane starts where it does. Decorative;
 * the phrase is the matrix's "Base foundation" cell.
 */
function InheritedGhost({
  base,
  fromPct,
  toPct,
}: {
  base: InheritedBase;
  fromPct: number;
  toPct: number;
}): React.ReactElement {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span
        className="absolute top-[20px] h-0 -translate-y-1/2"
        style={{
          left: `calc(${fromPct}% + ${TILE / 2 + 4}px)`,
          width: `calc(${toPct - fromPct}% - ${TILE + 8}px)`,
          borderTop: "2px dashed rgba(255,255,255,0.22)",
        }}
      />
      <div
        className="absolute flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ left: `${fromPct}%`, top: 0, width: `${(toPct - fromPct) * 0.5}%` }}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-[12px]"
          style={{
            width: TILE,
            height: TILE,
            border: "1.5px dashed rgba(255,255,255,0.32)",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <StageGlyph name={base.label} size={20} />
        </span>
        <span
          className="text-center font-display"
          style={{
            fontSize: "var(--fs-caption)",
            fontWeight: 500,
            lineHeight: "var(--fs-caption-lh)",
            color: "rgba(255,255,255,0.5)",
            textWrap: "balance",
          }}
        >
          {base.label}
        </span>
      </div>
    </div>
  );
}

function Lane({
  column,
  geometry,
  inheritedBase,
}: {
  column: BuildFlowColumn;
  geometry: LaneGeometry;
  inheritedBase: InheritedBase | undefined;
}): React.ReactElement {
  const { cols, step: STEP } = geometry;
  const isCleanStart = column.id === "cleanstart";
  const onLane = column.steps.slice(0, -1);
  const gateStep = column.steps[column.steps.length - 1] ?? "";
  const offset = cols - onLane.length;
  const fromPct = ((offset + 0.5) / cols) * 100;
  const leaveAt = offset * STEP;

  return (
    <div className="relative">
      {!isCleanStart && offset > 0 && inheritedBase && (
        <InheritedGhost
          base={inheritedBase}
          fromPct={(0.5 / cols) * 100}
          toPct={fromPct}
        />
      )}

      {/* The lane line, drawn as segments between the tiles (the tiles are
          translucent glass, so a continuous line would show through them):
          one per gap, then a last run into the gate. */}
      {Array.from({ length: onLane.length - 1 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute top-[20px] h-[2px] -translate-y-1/2"
          style={{
            left: `calc(${((offset + i + 0.5) / cols) * 100}% + ${TILE / 2 + 4}px)`,
            width: `calc(${100 / cols}% - ${TILE + 8}px)`,
            background: isCleanStart
              ? `linear-gradient(90deg, ${BRAND.violetLight}, #82E1FF)`
              : "rgba(255,255,255,0.22)",
            opacity: isCleanStart ? 0.8 : 1,
          }}
        />
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute top-[20px] h-[2px] -translate-y-1/2"
        style={{
          left: `calc(${((cols - 0.5) / cols) * 100}% + ${TILE / 2 + 4}px)`,
          right: "calc(-2rem - 1px)",
          background: isCleanStart
            ? `linear-gradient(90deg, ${BRAND.violetLight}, #82E1FF)`
            : "rgba(255,255,255,0.22)",
          opacity: isCleanStart ? 0.8 : 1,
        }}
      />
      {/* The pulse. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-[20px] size-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
          isCleanStart ? "cs-lane-pulse-long" : "cs-lane-pulse-short"
        }`}
        style={
          {
            "--lane-from": `${fromPct}%`,
            left: `${fromPct}%`,
            opacity: 0,
            background: isCleanStart ? "#C6F2FF" : "#ffffff",
            boxShadow: isCleanStart
              ? "0 0 10px 3px rgba(130,225,255,0.85), -14px 0 18px 2px rgba(130,225,255,0.35)"
              : "0 0 8px 2px rgba(255,255,255,0.6), -12px 0 14px 1px rgba(255,255,255,0.2)",
          } as React.CSSProperties
        }
      />

      {/* `<ol>` because the stages are an order, not a set. The last stage is
          the gate on wide screens, so its item stays for readers but leaves
          the layout there. */}
      <ol
        className="relative m-0 grid list-none gap-x-2 p-0"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {onLane.map((step, i) => (
          <li
            key={step}
            className="flex flex-col items-center gap-3"
            style={{ gridColumnStart: offset + i + 1 }}
          >
            <Stage label={step} tone={column.id} hitAt={leaveAt + i * STEP} />
          </li>
        ))}
        <li className="sr-only">{gateStep}</li>
      </ol>
    </div>
  );
}

function Gate({ label }: { label: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[18px]"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(169,116,255,0.45)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px -18px rgba(106,61,240,0.9)",
      }}
    >
      <span
        className="cs-gate-hit pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(130,225,255,0.35) 0%, rgba(106,61,240,0.2) 50%, transparent 100%)",
          opacity: 0,
        }}
      />
      <span
        className="pointer-events-none absolute inset-y-4 left-0 w-[2px] rounded-full"
        style={{
          background: `linear-gradient(180deg, transparent, ${BRAND.violetLight}, transparent)`,
        }}
      />
      <span
        className="relative mb-4 flex items-center justify-center rounded-[14px]"
        style={{
          width: 52,
          height: 52,
          background: "rgba(106,61,240,0.35)",
          border: "1px solid rgba(169,116,255,0.6)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 12px 28px -16px rgba(106,61,240,1)",
          color: "#F1E8FF",
        }}
      >
        <StageGlyph name={label} size={26} />
      </span>
      <span
        className="relative px-4 text-center font-display text-white"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: "var(--fs-h5-weight)",
          letterSpacing: "var(--fs-h5-ls)",
          lineHeight: "var(--fs-h5-lh)",
          textWrap: "balance",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Eyebrow({
  text,
  tone,
}: {
  text: string;
  tone: CompareTone;
}): React.ReactElement {
  return (
    <p
      className="font-display"
      style={{
        fontSize: "var(--fs-eyebrow)",
        fontWeight: "var(--fs-eyebrow-weight)",
        letterSpacing: "var(--fs-eyebrow-ls)",
        lineHeight: "var(--fs-eyebrow-lh)",
        textTransform: "uppercase",
        color: tone === "cleanstart" ? BRAND.violetPale : "rgba(255,255,255,0.5)",
      }}
    >
      {text}
    </p>
  );
}

function VendorName({
  column,
  rivalMark,
  size = 32,
}: {
  column: BuildFlowColumn;
  rivalMark: string;
  size?: number;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <VendorMark tone={column.id} rivalMark={rivalMark} size={size} />
      <p
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: "var(--fs-h5-weight)",
          letterSpacing: "var(--fs-h5-ls)",
          lineHeight: "var(--fs-h5-lh)",
        }}
      >
        {column.label}
      </p>
    </div>
  );
}

/** True when the document gives this lane prose beneath the diagram. */
function hasNotes(column: BuildFlowColumn): boolean {
  return Boolean(column.body) || Boolean(column.traits?.length);
}

/**
 * Body sentence and the "Key characteristics" list, at real type size. Returns
 * `null` where the source document draws the flow and writes nothing under it.
 */
function VendorNotes({
  column,
  rivalMark,
  withName,
}: {
  column: BuildFlowColumn;
  rivalMark: string;
  withName: boolean;
}): React.ReactElement | null {
  const isCleanStart = column.id === "cleanstart";
  if (!hasNotes(column)) return null;
  return (
    // Without its own name the block follows one printed above it, so it keeps
    // the same gap the name-plus-body pairing has.
    <div className={withName ? undefined : "mt-3"}>
      {withName && <VendorName column={column} rivalMark={rivalMark} size={28} />}
      {column.body ? (
      <p
        className={withName ? "mt-3" : ""}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body-sm)",
          lineHeight: "var(--fs-body-sm-lh)",
          letterSpacing: "var(--fs-body-ls)",
          color: "rgba(255,255,255,0.68)",
          maxWidth: "48ch",
        }}
      >
        {column.body}
      </p>
      ) : null}
      {column.traits?.length ? (
      <div className="mt-4">
        {column.traitsLabel ? (
          <Eyebrow text={column.traitsLabel} tone={column.id} />
        ) : null}
        <ul className="mt-2 flex flex-col gap-1">
          {column.traits.map((trait) => (
            <li key={trait} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="mt-[7px] block size-[5px] shrink-0 rounded-full"
                style={{
                  background: isCleanStart ? BRAND.violetLight : "rgba(255,255,255,0.4)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body-sm)",
                  lineHeight: "var(--fs-body-sm-lh)",
                  letterSpacing: "var(--fs-body-ls)",
                  color: isCleanStart ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.72)",
                }}
              >
                {trait}
              </span>
            </li>
          ))}
        </ul>
      </div>
      ) : null}
    </div>
  );
}

/** The wide diagram: vendor names, two lanes, the shared gate. Composed at
    the derived lane width and scaled to the panel. */
function LanesDiagram({
  rival,
  cleanstart,
  rivalMark,
  geometry,
  inheritedBase,
  gateLabel,
}: {
  rival: BuildFlowColumn;
  cleanstart: BuildFlowColumn;
  rivalMark: string;
  geometry: LaneGeometry;
  inheritedBase: InheritedBase | undefined;
  gateLabel: string;
}): React.ReactElement {
  return (
    <ScaleToFit designWidth={geometry.width}>
      <div
        className="grid items-center gap-x-8 gap-y-9"
        style={{
          width: geometry.width,
          gridTemplateColumns: "220px minmax(0, 1fr) 160px",
          gridTemplateRows: "auto auto auto",
        }}
      >
        {/* Where both columns carry the document's same lead-in, it is set once
            over the lanes rather than repeated per row. */}
        {rival.stepsLabel ? (
          <div style={{ gridColumn: 2, gridRow: 1, marginBottom: 4 }}>
            <Eyebrow text={rival.stepsLabel} tone="rival" />
          </div>
        ) : null}

        <div style={{ gridColumn: 1, gridRow: 2 }}>
          <VendorName column={rival} rivalMark={rivalMark} />
        </div>
        <div className="min-w-0" style={{ gridColumn: 2, gridRow: 2 }}>
          <Lane
            column={rival}
            geometry={geometry}
            inheritedBase={inheritedBase}
          />
        </div>

        <div style={{ gridColumn: 1, gridRow: 3 }}>
          <VendorName column={cleanstart} rivalMark={rivalMark} />
        </div>
        <div className="min-w-0" style={{ gridColumn: 2, gridRow: 3 }}>
          <Lane column={cleanstart} geometry={geometry} inheritedBase={undefined} />
        </div>

        <div className="self-stretch" style={{ gridColumn: 3, gridRow: "2 / span 2" }}>
          <Gate label={gateLabel} />
        </div>
      </div>
    </ScaleToFit>
  );
}

/** Narrow layout: one vendor in full — name, any notes, then the steps. */
function StackedLane({
  column,
  rivalMark,
  geometry,
}: {
  column: BuildFlowColumn;
  rivalMark: string;
  geometry: LaneGeometry;
}): React.ReactElement {
  return (
    <div className="md:grid md:grid-cols-2 md:gap-x-8">
      <div>
        <VendorName column={column} rivalMark={rivalMark} size={28} />
        <VendorNotes column={column} rivalMark={rivalMark} withName={false} />
      </div>
      <div className="max-md:mt-6">
        {column.stepsLabel ? (
          <Eyebrow text={column.stepsLabel} tone={column.id} />
        ) : null}
        <StackedSteps column={column} geometry={geometry} />
      </div>
    </div>
  );
}

/** Phone layout: a plain vertical list per vendor. */
function StackedSteps({
  column,
  geometry,
}: {
  column: BuildFlowColumn;
  geometry: LaneGeometry;
}): React.ReactElement {
  const isCleanStart = column.id === "cleanstart";
  return (
    <div className="mt-4">
      <ol className="relative m-0 flex list-none flex-col gap-5 p-0">
        {column.steps.map((step, i) => (
          <li key={step} className="relative flex items-center gap-4">
            {/* The connector is drawn per gap, from one tile to the next,
                rather than as a single rail behind the column: the tiles are
                translucent glass and a continuous line reads straight through
                them. Same reason the wide lane is segmented. */}
            {i < column.steps.length - 1 && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-[19px] top-full w-[2px]"
                style={{
                  height: 20,
                  background: isCleanStart
                    ? `linear-gradient(180deg, ${BRAND.violetLight}, #82E1FF)`
                    : "rgba(255,255,255,0.24)",
                  opacity: isCleanStart ? 0.85 : 1,
                }}
              />
            )}
            <Stage
              label={step}
              tone={column.id}
              hitAt={i * geometry.step}
              align="start"
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CompareBuildFlow({
  content,
  rivalMark,
  inheritedBase,
}: {
  content: BuildFlowSection;
  rivalMark: string;
  inheritedBase: InheritedBase | undefined;
}): React.ReactElement {
  const [rival, cleanstart] = content.columns;
  const geometry = laneGeometry(content.columns);
  const gateLabel = cleanstart.steps[cleanstart.steps.length - 1] ?? "";

  return (
    <Section
      padding="lg"
      data-section="CompareBuildFlow"
      className="overflow-hidden"
      style={{ background: BAND_DARK }}
    >
      <HexOutline side="right" />
      <EllipseGlow side="left" size="360px" />

      <Container className="relative">
        <BandHeader
          id="how-secure-images-are-built"
          heading={content.heading}
          intro={content.intro}
          tone="dark"
        />

        <Reveal delay={0.15} y={28} className="mt-10 lg:mt-14">
          <DarkPanel>
            {/* Wide: the scaled diagram, then the notes in two columns. */}
            <div className="hidden lg:block">
              <LanesDiagram
                rival={rival}
                cleanstart={cleanstart}
                rivalMark={rivalMark}
                geometry={geometry}
                inheritedBase={inheritedBase}
                gateLabel={gateLabel}
              />
              {hasNotes(rival) || hasNotes(cleanstart) ? (
                <div
                  className="mt-9 grid grid-cols-2 gap-x-10 border-t pt-8"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                >
                  <VendorNotes column={rival} rivalMark={rivalMark} withName />
                  <VendorNotes column={cleanstart} rivalMark={rivalMark} withName />
                </div>
              ) : null}
            </div>

            {/* Narrow: each vendor in full, stacked. */}
            <div className="flex flex-col gap-8 lg:hidden">
              <StackedLane column={rival} rivalMark={rivalMark} geometry={geometry} />
              <div
                className="border-t pt-8"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <StackedLane
                  column={cleanstart}
                  rivalMark={rivalMark}
                  geometry={geometry}
                />
              </div>
            </div>
          </DarkPanel>
        </Reveal>
      </Container>
    </Section>
  );
}
