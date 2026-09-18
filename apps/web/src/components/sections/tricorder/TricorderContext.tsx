import { Container, Section } from "@/components/layout";
import { GlassIcon } from "@/components/sections/_shared/GlassIcon";
import { Reveal } from "@/components/ui/Reveal";
import { ScaleToFit } from "@/components/ui/ScaleToFit";
import { SIGNAL } from "./tricorder-palette";

/**
 * "Software Doesn't Exist in Isolation." — the copy doc's own diagram, built in
 * the site's language rather than copied from it.
 *
 * Structure and vocabulary are the doc's: three signal groups (History,
 * Behavior, Relationships) each showing what it actually reads, their currents
 * converging into one COMPONENT, which resolves into the TRICORDER VERDICT.
 * Every label, version and item name below is the doc's.
 *
 * Three things are translated, because the doc's mock is styled for a white
 * page and this section is dark:
 *  - the group panels become glass on the section gradient, the way the Clean
 *    Libraries scenes are built, so the page keeps its light/dark alternation;
 *  - the doc's flat outline-in-a-circle icons become accent tiles, with the
 *    group marks as `GlassIcon` gems, the icon vocabulary the rest of the site uses;
 *  - the doc's green becomes the teal already sanctioned as a card accent
 *    (#2dd4bf) — plain green is not in the CleanStart palette.
 *
 * Cards carry no outlines: depth is fill, sheen and shadow. The verdict card is
 * the brightest object in the scene because it is where the diagram ends.
 *
 * The scene is laid out on a fixed 1320-wide canvas and scaled to fit, like the
 * other coded scenes. Below lg it stacks. The only motion is the reused
 * `cs-lep-beam` dash flow on the three currents, off under reduced motion.
 */

const MONO = "var(--font-mono), ui-monospace, Menlo, Consolas, monospace";

type GlyphKey =
  | "history"
  | "behavior"
  | "relationships"
  | "globe"
  | "shell"
  | "folder"
  | "code"
  | "user"
  | "cube"
  | "server"
  | "shield";

function Glyph({ name, size }: { name: GlyphKey; size: number }): React.ReactElement {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "history":
      return (
        <svg {...c}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "behavior":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      );
    case "relationships":
      return (
        <svg {...c}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9.5" r="2.4" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M15.5 14.4a4.6 4.6 0 0 1 5 4.6" />
        </svg>
      );
    case "globe":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
        </svg>
      );
    case "shell":
      return (
        <svg {...c}>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path d="m7.5 9.5 3 2.5-3 2.5" />
          <path d="M13 15h4" />
        </svg>
      );
    case "folder":
      return (
        <svg {...c}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
      );
    case "code":
      return (
        <svg {...c}>
          <path d="m8 7-5 5 5 5" />
          <path d="m16 7 5 5-5 5" />
        </svg>
      );
    case "user":
      return (
        <svg {...c}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "cube":
      return (
        <svg {...c}>
          <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" />
          <path d="M4 7l8 4.5L20 7" />
          <path d="M12 11.5v10" />
        </svg>
      );
    case "server":
      return (
        <svg {...c}>
          <rect x="3.5" y="4" width="17" height="6" rx="1.8" />
          <rect x="3.5" y="14" width="17" height="6" rx="1.8" />
          <path d="M7 7h.01M7 17h.01" />
        </svg>
      );
    case "shield":
      return (
        <svg {...c}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}

/* ── The doc's own content ───────────────────────────────────────────────── */

const HISTORY_VERSIONS = ["1.4.1", "1.4.2", "1.4.3"] as const;
const BEHAVIOR_ITEMS: { label: string; glyph: GlyphKey }[] = [
  { label: "Network", glyph: "globe" },
  { label: "Shell", glyph: "shell" },
  { label: "File System", glyph: "folder" },
  { label: "Code", glyph: "code" },
];
const RELATIONSHIP_ITEMS: { label: string; glyph: GlyphKey }[] = [
  { label: "Maintainer", glyph: "user" },
  { label: "Packages", glyph: "cube" },
  { label: "Infrastructure", glyph: "server" },
  { label: "Endpoints", glyph: "globe" },
];

const COMPONENT_NAME = "package-name@1.4.3";

/** The doc's green is not a CleanStart colour; teal is the sanctioned accent. */
const GROUPS = [
  { key: "history", label: "History", glyph: "history" as GlyphKey, accent: SIGNAL.history },
  { key: "behavior", label: "Behavior", glyph: "behavior" as GlyphKey, accent: SIGNAL.behavior },
  { key: "relationships", label: "Relationships", glyph: "relationships" as GlyphKey, accent: SIGNAL.relationships },
] as const;

/* ── Shared pieces ───────────────────────────────────────────────────────── */

/** Accent tint helper: the accent mixed into transparent at `pct`. */
const tint = (accent: string, pct: number): string => `color-mix(in srgb, ${accent} ${pct}%, transparent)`;
/** Accent lifted toward white, for glyphs and labels that must read on navy. */
const lift = (accent: string, pct: number): string => `color-mix(in srgb, ${accent} ${pct}%, #ffffff)`;

function GroupHeader({ accent, label }: { accent: string; label: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="block h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
      />
      <span
        className="font-display"
        style={{
          fontSize: "var(--fs-eyebrow)",
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: lift(accent, 55),
        }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Borderless glass card. Depth comes from the fill, an accent wash in the top
 * corner, a one-pixel top sheen and a long soft shadow, not from an outline.
 */
function GroupPanel({
  accent,
  children,
  className,
  style,
}: {
  accent: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      className={`overflow-hidden ${className ?? ""}`}
      style={{
        borderRadius: "24px",
        background: [
          `radial-gradient(120% 90% at 0% 0%, ${tint(accent, 20)} 0%, transparent 55%)`,
          "linear-gradient(180deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.03) 100%)",
        ].join(", "),
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 30px 60px -36px rgba(4,2,30,0.9)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A soft accent tile holding one line glyph. */
function ItemTile({ accent, glyph, size = 46 }: { accent: string; glyph: GlyphKey; size?: number }): React.ReactElement {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        color: lift(accent, 78),
        background: `linear-gradient(160deg, ${tint(accent, 30)} 0%, ${tint(accent, 12)} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 22px -14px ${accent}`,
      }}
    >
      <Glyph name={glyph} size={Math.round(size * 0.48)} />
    </span>
  );
}

function ItemLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span
      className="whitespace-nowrap text-white/72"
      style={{ fontSize: "var(--fs-badge)", fontWeight: 500, letterSpacing: "-0.005em" }}
    >
      {children}
    </span>
  );
}

/** History: a release timeline, with the version under analysis lit. */
function HistoryContent({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="relative grid w-full grid-cols-3">
      <span
        aria-hidden
        className="absolute h-[2px] rounded-full"
        style={{
          top: 8,
          left: "16.67%",
          right: "16.67%",
          background: `linear-gradient(90deg, rgba(255,255,255,0.14) 0%, ${tint(accent, 80)} 100%)`,
        }}
      />
      {HISTORY_VERSIONS.map((v, i) => {
        const current = i === HISTORY_VERSIONS.length - 1;
        return (
          <div key={v} className="relative flex flex-col items-center gap-3.5">
            <span className="flex h-[18px] items-center justify-center">
              <span
                className="block rounded-full"
                style={
                  current
                    ? {
                        width: 16,
                        height: 16,
                        background: accent,
                        boxShadow: `0 0 0 5px ${tint(accent, 22)}, 0 0 20px ${accent}`,
                      }
                    : {
                        width: 10,
                        height: 10,
                        background: "#2a2f8a",
                        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.32)",
                      }
                }
              />
            </span>
            <span
              className="inline-flex items-center rounded-full"
              style={{
                fontFamily: MONO,
                fontSize: "var(--fs-badge)",
                fontWeight: current ? 600 : 400,
                padding: current ? "5px 12px" : "5px 0",
                color: current ? "#ffffff" : "rgba(255,255,255,0.55)",
                background: current ? `linear-gradient(180deg, ${lift(accent, 88)} 0%, ${accent} 100%)` : undefined,
                boxShadow: current ? `0 8px 20px -8px ${accent}, inset 0 1px 0 rgba(255,255,255,0.35)` : undefined,
              }}
            >
              {v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Behavior: the four capability surfaces Tricorder watches. */
function BehaviorContent({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="grid w-full grid-cols-4">
      {BEHAVIOR_ITEMS.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-3">
          <ItemTile accent={accent} glyph={item.glyph} />
          <ItemLabel>{item.label}</ItemLabel>
        </div>
      ))}
    </div>
  );
}

/** Relationships: maintainer through to endpoints, joined by a flowing link. */
function RelationshipsContent({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="flex w-full items-start">
      {RELATIONSHIP_ITEMS.map((item, i) => (
        <div key={item.label} className={`flex items-start ${i > 0 ? "flex-1" : ""}`}>
          {i > 0 ? (
            <span
              aria-hidden
              className="mt-[22px] h-[2px] min-w-3 flex-1 rounded-full"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${lift(accent, 70)} 0 3px, transparent 3px 7px)`,
                opacity: 0.8,
              }}
            />
          ) : null}
          <div className="flex w-[92px] flex-col items-center gap-3">
            <ItemTile accent={accent} glyph={item.glyph} />
            <ItemLabel>{item.label}</ItemLabel>
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupContent({ groupKey, accent }: { groupKey: string; accent: string }): React.ReactElement {
  if (groupKey === "history") return <HistoryContent accent={accent} />;
  if (groupKey === "behavior") return <BehaviorContent accent={accent} />;
  return <RelationshipsContent accent={accent} />;
}

const CARD_TITLE_STYLE: React.CSSProperties = {
  fontSize: "var(--fs-h5)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  lineHeight: 1.2,
  textTransform: "uppercase",
};

const COMPONENT_ACCENT = "#7aa6ff";

/** The component the three currents resolve onto. */
function ComponentCard(): React.ReactElement {
  return (
    <div
      className="flex h-full w-full items-center gap-4 px-5"
      style={{
        borderRadius: "22px",
        background: [
          `radial-gradient(90% 120% at 0% 50%, ${tint(COMPONENT_ACCENT, 22)} 0%, transparent 60%)`,
          "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
        ].join(", "),
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 28px 56px -30px rgba(4,2,30,0.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <ItemTile accent={COMPONENT_ACCENT} glyph="cube" size={52} />
      <div className="min-w-0">
        <p className="font-display text-white" style={CARD_TITLE_STYLE}>
          Component
        </p>
        <p className="mt-1 truncate" style={{ fontFamily: MONO, fontSize: "var(--fs-code)", color: lift(COMPONENT_ACCENT, 70) }}>
          {COMPONENT_NAME}
        </p>
      </div>
    </div>
  );
}

const VERDICT_ACCENT = "#8b6cff";

/**
 * The verdict: the end of the diagram, so it is the brightest object in it.
 * Brand indigo → violet body, a light sheen across the top and a violet halo.
 */
function VerdictCard(): React.ReactElement {
  return (
    <div
      className="relative flex h-full w-full items-center gap-4 overflow-hidden px-5"
      style={{
        borderRadius: "22px",
        background: "linear-gradient(120deg, #1a2399 0%, #3b22c4 55%, #6a2fe0 100%)",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.28)",
          "0 30px 60px -26px rgba(4,2,30,0.95)",
          "0 0 70px -14px rgba(139,108,255,0.75)",
        ].join(", "),
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          right: -60,
          top: -80,
          width: 220,
          height: 220,
          background: "radial-gradient(closest-side, rgba(201,184,255,0.35), rgba(201,184,255,0))",
        }}
      />
      <span className="relative">
        <GlassIcon accent={VERDICT_ACCENT} size={52}>
          <Glyph name="shield" size={26} />
        </GlassIcon>
      </span>
      <div className="relative min-w-0">
        <p className="font-display text-white" style={CARD_TITLE_STYLE}>
          Tricorder Verdict
        </p>
        <p className="mt-1 text-white/80" style={{ fontSize: "var(--fs-caption)", letterSpacing: "-0.01em" }}>
          Evidence-backed verdict.
        </p>
      </div>
    </div>
  );
}

/* ── Desktop scene: fixed 1320 × 538 canvas, scaled to fit ───────────────── */

const VB = { w: 1320, h: 538 } as const;
/** Panel geometry. Widths differ because the doc's three panels carry different loads. */
const PANELS = {
  history: { x: 0, w: 360 },
  behavior: { x: 386, w: 440 },
  relationships: { x: 852, w: 468 },
} as const;
const PANEL_Y = 0;
const PANEL_H = 200;
const PANEL_BOTTOM = PANEL_Y + PANEL_H;
const BUS_Y = 272;
const CARD_X = VB.w / 2; // 660
const COMPONENT = { y: 314, h: 88, w: 380 } as const;
const VERDICT_CARD = { y: 438, h: 100, w: 440 } as const;

const centreOf = (p: { x: number; w: number }): number => p.x + p.w / 2;

/** Elbow from a panel's underside, in to the bus, then down to the component. */
function elbow(cx: number): string {
  const r = 18;
  if (Math.abs(cx - CARD_X) < 1) {
    return `M ${cx} ${PANEL_BOTTOM} L ${cx} ${COMPONENT.y}`;
  }
  const dir = cx < CARD_X ? 1 : -1;
  return [
    `M ${cx} ${PANEL_BOTTOM}`,
    `L ${cx} ${BUS_Y - r}`,
    `Q ${cx} ${BUS_Y} ${cx + dir * r} ${BUS_Y}`,
    `L ${CARD_X - dir * r} ${BUS_Y}`,
    `Q ${CARD_X} ${BUS_Y} ${CARD_X} ${BUS_Y + r}`,
    `L ${CARD_X} ${COMPONENT.y}`,
  ].join(" ");
}

function SceneDesktop(): React.ReactElement {
  return (
    <ScaleToFit designWidth={VB.w} className="mx-auto hidden max-w-[1320px] lg:block">
      <div className="relative" style={{ width: VB.w, height: VB.h }}>
        {/* Currents. Drawn first so the cards sit over their landing points. */}
        <svg aria-hidden viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            <filter id="tri-ctx-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {GROUPS.map((g, i) => {
            const cx = centreOf(PANELS[g.key]);
            return (
              <g key={g.key}>
                <path d={elbow(cx)} stroke={g.accent} strokeOpacity="0.32" strokeWidth="6" strokeLinecap="round" />
                <path
                  className="cs-lep-beam"
                  d={elbow(cx)}
                  stroke={g.accent}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeDasharray="2 9"
                  style={{ animationDelay: `${i * -0.4}s` }}
                />
              </g>
            );
          })}
          {/* Junction, then the drop into the verdict. */}
          <circle cx={CARD_X} cy={BUS_Y} r="4.5" fill="#c9b8ff" filter="url(#tri-ctx-glow)" />
          <path
            d={`M ${CARD_X} ${COMPONENT.y + COMPONENT.h} L ${CARD_X} ${VERDICT_CARD.y}`}
            stroke="#8b6cff"
            strokeOpacity="0.5"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="cs-lep-beam"
            d={`M ${CARD_X} ${COMPONENT.y + COMPONENT.h} L ${CARD_X} ${VERDICT_CARD.y}`}
            stroke="#c9b8ff"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeDasharray="2 9"
          />
        </svg>

        {/* Group panels. */}
        {GROUPS.map((g) => {
          const p = PANELS[g.key];
          return (
            <GroupPanel
              key={g.key}
              accent={g.accent}
              className="absolute flex flex-col"
              style={{ left: p.x, top: PANEL_Y, width: p.w, height: PANEL_H, padding: "22px 24px 26px" }}
            >
              <GroupHeader accent={g.accent} label={g.label} />
              <div className="flex flex-1 items-center">
                <GroupContent groupKey={g.key} accent={g.accent} />
              </div>
            </GroupPanel>
          );
        })}

        <div
          className="absolute"
          style={{ left: CARD_X - COMPONENT.w / 2, top: COMPONENT.y, width: COMPONENT.w, height: COMPONENT.h }}
        >
          <ComponentCard />
        </div>
        <div
          className="absolute"
          style={{ left: CARD_X - VERDICT_CARD.w / 2, top: VERDICT_CARD.y, width: VERDICT_CARD.w, height: VERDICT_CARD.h }}
        >
          <VerdictCard />
        </div>
      </div>
    </ScaleToFit>
  );
}

/* ── Stacked scene for < lg ──────────────────────────────────────────────── */

function Drop({ accent }: { accent: string }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="cs-lep-beam-v my-4 block h-8 w-[3px] shrink-0 rounded-full"
      style={{
        background: `linear-gradient(180deg, ${accent} 0%, rgba(139,108,255,0.55) 100%)`,
        boxShadow: `0 0 10px color-mix(in srgb, ${accent} 55%, transparent)`,
      }}
    />
  );
}

/** Below lg the four-across rows would crush, so they wrap to a 2×2 grid. */
function StackedGroupContent({ groupKey, accent }: { groupKey: string; accent: string }): React.ReactElement {
  if (groupKey === "history") return <HistoryContent accent={accent} />;
  const items = groupKey === "behavior" ? BEHAVIOR_ITEMS : RELATIONSHIP_ITEMS;
  return (
    <div className="grid w-full grid-cols-2 gap-x-3 gap-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center gap-2.5">
          <ItemTile accent={accent} glyph={item.glyph} size={36} />
          <ItemLabel>{item.label}</ItemLabel>
        </div>
      ))}
    </div>
  );
}

function SceneMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center lg:hidden">
      {GROUPS.map((g) => (
        <div key={g.key} className="flex w-full max-w-[460px] flex-col items-center">
          <GroupPanel accent={g.accent} className="relative flex w-full flex-col gap-6 p-4 sm:p-5">
            <GroupHeader accent={g.accent} label={g.label} />
            <StackedGroupContent groupKey={g.key} accent={g.accent} />
          </GroupPanel>
          <Drop accent={g.accent} />
        </div>
      ))}
      <div className="w-full max-w-[460px]" style={{ height: "88px" }}>
        <ComponentCard />
      </div>
      <Drop accent="#8b6cff" />
      <div className="w-full max-w-[460px]" style={{ height: "100px" }}>
        <VerdictCard />
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export function TricorderContext(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{ background: "linear-gradient(180deg, #151021 0%, #131E8F 68%, #471EC0 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none rounded-full"
        style={{
          left: "50%",
          top: "58%",
          width: "900px",
          height: "900px",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(closest-side, rgba(110,64,255,0.20) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        {/* Left-aligned, so this section still reads differently from the
            centre-headed ones either side of it. */}
        <Reveal header>
          <div className="max-w-[760px]">
            <h2
              className="font-display text-white"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}
            >
              Software Doesn&rsquo;t Exist in Isolation.
            </h2>
            <p
              className="mt-5 font-sans text-white/80"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance" }}
            >
              Understand every component through its history, behavior, and
              relationships.
            </p>
          </div>
        </Reveal>

        <Reveal y={36} className="mt-14 lg:mt-16">
          <SceneDesktop />
          <SceneMobile />
        </Reveal>
      </Container>
    </Section>
  );
}
