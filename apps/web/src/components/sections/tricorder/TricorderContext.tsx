import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { SIGNAL, VERDICT } from "./tricorder-palette";

/**
 * "Software Doesn't Exist in Isolation." — the section makes the argument
 * instead of diagramming it. One panel holds the same package twice: at the
 * top, seen alone, where every isolated fact is reassuring; below, seen through
 * the three lenses, where the same package is plainly malicious. The two halves
 * are separated by tone, not by a rule — the isolation half is desaturated and
 * flat, the context half carries the brand light — so the eye travels from a
 * dead readout into a live one.
 *
 * Each lens shows real evidence rather than an icon: a version timeline, a
 * capability profile, and a relationship graph. Their three currents converge
 * into the verdict bar at the foot of the panel.
 *
 * Everything is CSS/SVG. The only motion is the reused `cs-lep-beam-v` pulse on
 * the three converging currents, already disabled under prefers-reduced-motion.
 */

const MONO = "var(--font-mono), ui-monospace, Menlo, Consolas, monospace";

interface Lens {
  key: "history" | "behavior" | "relationships";
  index: string;
  title: string;
  detail: string;
  /** The single damning fact this lens contributes, shown under its evidence. */
  finding: string;
  accent: string;
}

const LENSES: Lens[] = [
  {
    key: "history",
    index: "01",
    title: "History",
    detail: "Versions, changes, vulnerabilities.",
    finding: "New maintainer, 3 days ago",
    accent: SIGNAL.history,
  },
  {
    key: "behavior",
    index: "02",
    title: "Behavior",
    detail: "Capabilities, purpose, reachability.",
    finding: "Network + shell at install",
    accent: SIGNAL.behavior,
  },
  {
    key: "relationships",
    index: "03",
    title: "Relationships",
    detail: "Dependencies, maintainers, infrastructure.",
    finding: "Shared host with 2 flagged packages",
    accent: SIGNAL.relationships,
  },
];

/* ── Evidence: version history ───────────────────────────────────────────── */

const RELEASES = [
  { version: "2.4.0", y: 14, flagged: false },
  { version: "2.4.1", y: 46, flagged: false },
  { version: "2.5.0", y: 78, flagged: true },
] as const;

function HistoryEvidence({ accent }: { accent: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 132 112" className="h-full w-full" preserveAspectRatio="xMinYMid meet" aria-hidden>
      <line x1="14" y1="14" x2="14" y2="46" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" />
      <line x1="14" y1="46" x2="14" y2="78" stroke={VERDICT.malicious} strokeWidth="1.5" strokeDasharray="3 4" />
      {RELEASES.map((r) => (
        <g key={r.version}>
          {r.flagged ? <circle cx="14" cy={r.y} r="10" fill={VERDICT.malicious} opacity="0.16" /> : null}
          <circle
            cx="14"
            cy={r.y}
            r="5"
            fill={r.flagged ? VERDICT.malicious : "transparent"}
            stroke={r.flagged ? VERDICT.malicious : accent}
            strokeWidth="1.8"
            strokeOpacity={r.flagged ? 1 : 0.75}
          />
          <text
            x="30"
            y={r.y + 4}
            style={{ fontFamily: MONO }}
            fontSize="12"
            fontWeight={r.flagged ? 600 : 400}
            fill={r.flagged ? "#ffffff" : "rgba(255,255,255,0.55)"}
          >
            {r.version}
          </text>
        </g>
      ))}
      <text x="30" y="100" style={{ fontFamily: MONO }} fontSize="10.5" fill={VERDICT.malicious}>
        published 12 min ago
      </text>
    </svg>
  );
}

/* ── Evidence: capability profile ────────────────────────────────────────── */

const CAPABILITIES = [
  { label: "network", live: true },
  { label: "shell", live: true },
  { label: "file system", live: true },
  { label: "crypto", live: false },
] as const;

function BehaviorEvidence({ accent }: { accent: string }): React.ReactElement {
  return (
    <ul className="flex h-full flex-col justify-center gap-2">
      {CAPABILITIES.map((c) => (
        <li key={c.label} className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="block h-[7px] w-[7px] shrink-0 rounded-full"
            style={
              c.live
                ? { background: accent, boxShadow: `0 0 9px ${accent}` }
                : { background: "transparent", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.22)" }
            }
          />
          <span
            className="truncate"
            style={{
              fontFamily: MONO,
              fontSize: "var(--fs-badge)",
              color: c.live ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.34)",
            }}
          >
            {c.label}
          </span>
          {c.live ? (
            <span
              className="ml-auto shrink-0"
              style={{ fontFamily: MONO, fontSize: "clamp(10px, 0.78vw, 11px)", color: `color-mix(in srgb, ${accent} 70%, #ffffff)` }}
            >
              live
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* ── Evidence: relationship graph ────────────────────────────────────────── */

const GRAPH_NODES = [
  { x: 20, y: 24, hub: false },
  { x: 20, y: 80, hub: false },
  { x: 66, y: 52, hub: true },
  { x: 112, y: 26, hub: false },
  { x: 112, y: 78, hub: false },
] as const;
const GRAPH_EDGES = [
  [0, 2],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 4],
] as const;

function RelationshipsEvidence({ accent }: { accent: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 132 112" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {GRAPH_EDGES.map(([a, b]) => {
        const na = GRAPH_NODES[a];
        const nb = GRAPH_NODES[b];
        return (
          <line
            key={`${a}-${b}`}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke={accent}
            strokeWidth="1.4"
            strokeOpacity="0.5"
          />
        );
      })}
      {GRAPH_NODES.map((n, i) => (
        <g key={`${n.x}-${n.y}`}>
          {n.hub ? <circle cx={n.x} cy={n.y} r="15" fill={accent} opacity="0.18" /> : null}
          <circle
            cx={n.x}
            cy={n.y}
            r={n.hub ? 7 : 5}
            fill={n.hub ? accent : "rgba(12,14,40,0.95)"}
            stroke={i === 3 || i === 4 ? VERDICT.malicious : accent}
            strokeWidth="1.8"
          />
        </g>
      ))}
      <text x="66" y="104" textAnchor="middle" style={{ fontFamily: MONO }} fontSize="10.5" fill="rgba(255,255,255,0.55)">
        one host · three packages
      </text>
    </svg>
  );
}

function EvidenceFor({ lens }: { lens: Lens }): React.ReactElement {
  switch (lens.key) {
    case "history":
      return <HistoryEvidence accent={lens.accent} />;
    case "behavior":
      return <BehaviorEvidence accent={lens.accent} />;
    case "relationships":
      return <RelationshipsEvidence accent={lens.accent} />;
  }
}

/* ── Panel pieces ────────────────────────────────────────────────────────── */

function ZoneLabel({ children, tone }: { children: string; tone: "muted" | "live" }): React.ReactElement {
  return (
    <p
      className="font-display"
      style={{
        fontSize: "var(--fs-badge)",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: tone === "muted" ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.72)",
      }}
    >
      {children}
    </p>
  );
}

function LensPanel({ lens }: { lens: Lens }): React.ReactElement {
  return (
    <div
      className="flex flex-col"
      style={{
        borderRadius: "16px",
        padding: "14px 14px 12px",
        background: `linear-gradient(180deg, color-mix(in srgb, ${lens.accent} 14%, transparent) 0%, rgba(255,255,255,0.015) 62%, transparent 100%)`,
      }}
    >
      <div className="flex items-baseline justify-between">
        <span
          className="font-display text-white"
          style={{ fontSize: "var(--fs-h6)", fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          {lens.title}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: "clamp(10px, 0.78vw, 11px)",
            letterSpacing: "0.08em",
            color: `color-mix(in srgb, ${lens.accent} 65%, #ffffff)`,
          }}
        >
          {lens.index}
        </span>
      </div>

      <div className="mt-3 w-full" style={{ height: "clamp(92px, 8vw, 108px)" }}>
        <EvidenceFor lens={lens} />
      </div>

      <p
        className="mt-3 border-t pt-2.5 text-white/75"
        style={{
          borderColor: "rgba(255,255,255,0.09)",
          fontSize: "var(--fs-caption)",
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          textWrap: "balance",
        }}
      >
        {lens.finding}
      </p>
    </div>
  );
}

/** The two-state panel: the package alone, then the package in context. */
function ContextPanel(): React.ReactElement {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: "var(--radius-cs-card)",
        border: "1px solid rgba(255,255,255,0.13)",
        boxShadow: "0 44px 100px -40px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {/* ── Seen in isolation: flat, desaturated, quietly reassuring ── */}
      <div
        className="px-6 pb-6 pt-5 sm:px-7"
        style={{ background: "linear-gradient(180deg, rgba(58,60,78,0.95) 0%, rgba(38,40,56,0.95) 100%)" }}
      >
        <ZoneLabel tone="muted">Seen in isolation</ZoneLabel>
        <div
          className="mt-3.5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-x-4"
          style={{ filter: "saturate(0.2)" }}
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white/55"
            style={{ background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" />
              <path d="M4 7l8 4.5L20 7" />
              <path d="M12 11.5v10" />
            </svg>
          </span>
          <div className="min-w-0 w-full sm:flex-1">
            <p className="truncate text-white/80" style={{ fontFamily: MONO, fontSize: "var(--fs-code)", fontWeight: 500 }}>
              strutil-core<span className="text-white/40">@</span>2.5.0
            </p>
            <p className="mt-0.5 truncate text-white/40" style={{ fontFamily: MONO, fontSize: "var(--fs-badge)" }}>
              signed · 0 CVEs · license OK
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 font-display text-white/55"
            style={{
              fontSize: "var(--fs-badge)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "rgba(255,255,255,0.05)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
            Nothing to flag
          </span>
        </div>
      </div>

      {/* ── Seen in context: the brand light comes on ── */}
      <div
        className="relative px-6 pb-6 pt-5 sm:px-7"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(110,64,255,0.34) 0%, rgba(110,64,255,0) 62%), linear-gradient(180deg, rgba(13,15,44,0.96) 0%, rgba(9,10,30,0.98) 100%)",
        }}
      >
        {/* The same identifier appears in both zones, so the panel reads as one
            package shown twice rather than two different packages. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <ZoneLabel tone="live">Seen in context</ZoneLabel>
          <span className="truncate text-white/40" style={{ fontFamily: MONO, fontSize: "var(--fs-badge)" }}>
            strutil-core@2.5.0
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LENSES.map((lens) => (
            <LensPanel key={lens.key} lens={lens} />
          ))}
        </div>

        {/* Three currents converging on the verdict. */}
        <div aria-hidden className="hidden gap-3 sm:grid sm:grid-cols-3" style={{ height: "26px" }}>
          {LENSES.map((lens, i) => (
            <div key={lens.key} className="flex justify-center">
              <span
                className="cs-lep-beam-v block w-[3px] rounded-full"
                style={{
                  height: "100%",
                  boxShadow: `0 0 10px color-mix(in srgb, ${lens.accent} 60%, transparent)`,
                  background: `linear-gradient(180deg, transparent 0%, ${lens.accent} 45%, ${VERDICT.malicious} 100%)`,
                  animationDelay: `${i * -0.35}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Status banner, not a card: the glyph leads the line at every width, so
            nothing wraps onto an orphan row on a phone. */}
        <div
          className="mt-4 flex items-center gap-4 px-5 py-4 sm:mt-0"
          style={{
            borderRadius: "16px",
            background: `linear-gradient(100deg, color-mix(in srgb, ${VERDICT.malicious} 24%, transparent) 0%, color-mix(in srgb, ${VERDICT.malicious} 6%, transparent) 70%)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${VERDICT.malicious} 40%, transparent)`,
          }}
        >
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{
              background: `linear-gradient(135deg, ${VERDICT.malicious} 0%, #c11d3d 100%)`,
              boxShadow: `0 12px 28px -10px ${VERDICT.malicious}, inset 0 1px 1px rgba(255,255,255,0.35)`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8.5v5" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p
              className="font-display text-white"
              style={{ fontSize: "var(--fs-h5)", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}
            >
              Malicious
            </p>
            <p className="mt-1 text-white/60" style={{ fontFamily: MONO, fontSize: "var(--fs-badge)" }}>
              no single lens proves it · all three together do
            </p>
          </div>
        </div>
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
          right: "-200px",
          top: "50%",
          width: "760px",
          height: "760px",
          transform: "translateY(-50%)",
          background: "radial-gradient(closest-side, rgba(110,64,255,0.22) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-14">
          {/* ── Left: the argument ── */}
          <div className="max-w-[520px]">
            <Reveal header>
              <h2
                className="font-display text-white"
                style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}
              >
                Software Doesn&rsquo;t Exist in Isolation.
              </h2>
            </Reveal>
            <Reveal header delay={0.16} y={20}>
              <p
                className="mt-6 font-sans text-white/80"
                style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance" }}
              >
                Understand every component through its history, behavior, and
                relationships.
              </p>
            </Reveal>

            {/* Quiet on purpose: the panel opposite carries the density, so the
                legend is an accent bar and two lines, not a third stack of cards. */}
            <RevealStagger className="mt-10 flex flex-col gap-6">
              {LENSES.map((lens) => (
                <RevealItem key={lens.key}>
                  <div className="flex items-start gap-4 pl-4" style={{ borderLeft: `2px solid ${lens.accent}` }}>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2.5">
                        <h3
                          className="font-display text-white"
                          style={{ fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}
                        >
                          {lens.title}
                        </h3>
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: "clamp(10px, 0.78vw, 11px)",
                            letterSpacing: "0.1em",
                            color: `color-mix(in srgb, ${lens.accent} 58%, #ffffff)`,
                          }}
                        >
                          {lens.index}
                        </span>
                      </div>
                      <p
                        className="mt-1 font-sans text-white/60"
                        style={{ fontSize: "var(--fs-body)", lineHeight: 1.5, letterSpacing: "-0.01em" }}
                      >
                        {lens.detail}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>

          {/* ── Right: the demonstration ── */}
          <Reveal y={36} className="w-full">
            <ContextPanel />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
