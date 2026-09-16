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
 *  - the doc's flat outline-in-a-circle icons become `GlassIcon` gem tiles,
 *    which is the icon vocabulary the rest of the site uses;
 *  - the doc's green becomes the teal already sanctioned as a card accent
 *    (#2dd4bf) — plain green is not in the CleanStart palette.
 *
 * The verdict card reuses the homepage Intelligence Center treatment (the
 * navy → indigo → violet gradient plus the diagonal hatch), which is the site's
 * existing way of saying "this is the Tricorder layer".
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

function GroupHeader({ accent, label, glyph }: { accent: string; label: string; glyph: GlyphKey }): React.ReactElement {
  return (
    <div className="flex items-center gap-3.5">
      <GlassIcon accent={accent} size={44}>
        <Glyph name={glyph} size={22} />
      </GlassIcon>
      <span
        className="font-display"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: `color-mix(in srgb, ${accent} 62%, #ffffff)`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Glass shell every group panel shares. */
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
      className={className}
      style={{
        borderRadius: "20px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)",
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 26%, rgba(255,255,255,0.09)), 0 26px 50px -34px rgba(0,0,0,0.85)`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Chevron({ size = 14 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.42)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** History: the version chain, with the release under analysis filled in. */
function HistoryContent({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center gap-3 px-4 py-7">
      {HISTORY_VERSIONS.map((v, i) => {
        const current = i === HISTORY_VERSIONS.length - 1;
        return (
          <div key={v} className="flex items-center gap-3">
            {i > 0 ? <Chevron /> : null}
            <span
              className="inline-flex items-center justify-center rounded-full px-3.5 py-2"
              style={{
                fontFamily: MONO,
                fontSize: "var(--fs-badge)",
                fontWeight: current ? 600 : 400,
                color: current ? "#ffffff" : "rgba(255,255,255,0.68)",
                background: current ? accent : "rgba(255,255,255,0.06)",
                boxShadow: current
                  ? `0 0 22px color-mix(in srgb, ${accent} 55%, transparent), inset 0 1px 1px rgba(255,255,255,0.35)`
                  : "inset 0 0 0 1px rgba(255,255,255,0.13)",
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

/** Behavior: the four capability surfaces, divided like the doc's panel. */
function BehaviorContent({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="flex h-full items-stretch justify-center px-2">
      {BEHAVIOR_ITEMS.map((item, i) => (
        <div key={item.label} className="flex flex-1 items-center">
          {i > 0 ? (
            <span
              aria-hidden
              className="h-12 w-px shrink-0"
              style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.16), transparent)" }}
            />
          ) : null}
          <div className="flex flex-1 flex-col items-center gap-2.5 px-1">
            <span style={{ color: accent }}>
              <Glyph name={item.glyph} size={26} />
            </span>
            <span
              className="whitespace-nowrap text-white/70"
              style={{ fontSize: "var(--fs-badge)", letterSpacing: "-0.01em" }}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Relationships: the chain the doc draws, maintainer through to endpoints. */
function RelationshipsContent({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center gap-2 px-4">
      {RELATIONSHIP_ITEMS.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          {i > 0 ? <Chevron size={13} /> : null}
          <div className="flex flex-col items-center gap-2.5">
            <span style={{ color: accent }}>
              <Glyph name={item.glyph} size={26} />
            </span>
            <span
              className="whitespace-nowrap text-white/70"
              style={{ fontSize: "var(--fs-badge)", letterSpacing: "-0.01em" }}
            >
              {item.label}
            </span>
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

/** The component the three currents resolve onto. */
function ComponentCard(): React.ReactElement {
  return (
    <div
      className="flex h-full w-full items-center gap-4 px-6"
      style={{
        borderRadius: "18px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.20), 0 26px 50px -30px rgba(0,0,0,0.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span className="shrink-0" style={{ color: "#8fb6ff" }}>
        <Glyph name="cube" size={36} />
      </span>
      <div className="min-w-0">
        <p
          className="font-display text-white"
          style={{ fontSize: "var(--fs-h5)", fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.2, textTransform: "uppercase" }}
        >
          Component
        </p>
        <p className="mt-1 truncate" style={{ fontFamily: MONO, fontSize: "var(--fs-code)", color: "#8fb6ff" }}>
          {COMPONENT_NAME}
        </p>
      </div>
    </div>
  );
}

/**
 * The verdict, in the homepage Intelligence Center treatment: the brand
 * navy → indigo → violet gradient under the diagonal hatch.
 */
function VerdictCard(): React.ReactElement {
  return (
    <div
      className="relative flex h-full w-full items-center gap-4 overflow-hidden px-6"
      style={{
        borderRadius: "18px",
        background: "linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), 0 30px 60px -28px rgba(0,0,0,0.95), 0 0 50px -18px rgba(122,89,255,0.55)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "22px 22px",
          mixBlendMode: "luminosity",
          opacity: 0.32,
        }}
      />
      <span className="relative shrink-0 text-white">
        <Glyph name="shield" size={38} />
      </span>
      <div className="relative min-w-0">
        <p
          className="font-display text-white"
          style={{ fontSize: "var(--fs-h5)", fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.2, textTransform: "uppercase" }}
        >
          Tricorder Verdict
        </p>
        <p className="mt-1 text-white/75" style={{ fontSize: "var(--fs-caption)", letterSpacing: "-0.01em" }}>
          Evidence-backed verdict.
        </p>
      </div>
    </div>
  );
}

/* ── Desktop scene: fixed 1120 × 504 canvas, scaled to fit ───────────────── */

const VB = { w: 1320, h: 538 } as const;
/** Panel geometry. Widths differ because the doc's three panels carry different loads. */
const PANELS = {
  history: { x: 0, w: 360 },
  behavior: { x: 386, w: 440 },
  relationships: { x: 852, w: 468 },
} as const;
const HEAD_Y = 0;
const PANEL_Y = 68;
const PANEL_H = 148;
const PANEL_BOTTOM = PANEL_Y + PANEL_H; // 216
const BUS_Y = 272;
const CARD_X = VB.w / 2; // 660
const COMPONENT = { y: 314, h: 92, w: 360 } as const;
const VERDICT_CARD = { y: 442, h: 96, w: 420 } as const;

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

        {/* Group headers and panels. */}
        {GROUPS.map((g) => {
          const p = PANELS[g.key];
          return (
            <div key={g.key} className="absolute" style={{ left: p.x, top: HEAD_Y, width: p.w }}>
              <GroupHeader accent={g.accent} label={g.label} glyph={g.glyph} />
              <GroupPanel accent={g.accent} style={{ marginTop: PANEL_Y - 44, height: PANEL_H }}>
                <GroupContent groupKey={g.key} accent={g.accent} />
              </GroupPanel>
            </div>
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
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <span className="shrink-0" style={{ color: accent }}>
            <Glyph name={item.glyph} size={24} />
          </span>
          <span className="truncate text-white/70" style={{ fontSize: "var(--fs-badge)", letterSpacing: "-0.01em" }}>
            {item.label}
          </span>
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
          <div className="w-full">
            <GroupHeader accent={g.accent} label={g.label} glyph={g.glyph} />
            <GroupPanel accent={g.accent} className="mt-4">
              <StackedGroupContent groupKey={g.key} accent={g.accent} />
            </GroupPanel>
          </div>
          <Drop accent={g.accent} />
        </div>
      ))}
      <div className="w-full max-w-[460px]" style={{ height: "88px" }}>
        <ComponentCard />
      </div>
      <Drop accent="#8b6cff" />
      <div className="w-full max-w-[460px]" style={{ height: "96px" }}>
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
