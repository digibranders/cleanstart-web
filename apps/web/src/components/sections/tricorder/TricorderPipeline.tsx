import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { GlassIcon } from "@/components/sections/_shared/GlassIcon";
import { INK, INK_MUTED, SIGNAL, VERDICT } from "./tricorder-palette";

/**
 * "From Signals to Verdicts." — the four analysis stages as a left-to-right
 * rail (Analyze → Compare → Correlate → Enrich) that terminates in a dark
 * verdict terminal showing the three possible outcomes. A pulse travels the
 * rail under the stages so the row reads as a pipeline, not a list of tiles.
 * Light section. Stages stack 2×2 below lg and single-column below sm.
 */

type StageKey = "analyze" | "compare" | "correlate" | "enrich";

interface Stage {
  key: StageKey;
  index: string;
  title: string;
  desc: string;
  accent: string;
}

const STAGES: Stage[] = [
  { key: "analyze", index: "01", title: "Analyze", desc: "Understand capabilities, purpose, and reachability.", accent: SIGNAL.behavior },
  { key: "compare", index: "02", title: "Compare", desc: "Identify unexpected changes across versions.", accent: SIGNAL.history },
  { key: "correlate", index: "03", title: "Correlate", desc: "Connect packages, maintainers, and infrastructure.", accent: SIGNAL.relationships },
  { key: "enrich", index: "04", title: "Enrich", desc: "Add threat intelligence and vulnerability context.", accent: SIGNAL.intel },
];

const OUTCOMES = [
  { label: "Malicious", color: VERDICT.malicious },
  { label: "Uncertain", color: VERDICT.uncertain },
  { label: "Pass", color: VERDICT.pass },
] as const;

const RAIL_CSS = `
@keyframes cs-tri-rail{from{background-position:-40% 0}to{background-position:140% 0}}
.cs-tri-rail-pulse{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.9) 12%,transparent 24%);background-size:38% 100%;animation:cs-tri-rail 4.2s linear infinite}
@media (prefers-reduced-motion:reduce){.cs-tri-rail-pulse{animation:none;opacity:0}}
`;

function StageGlyph({ stage, size }: { stage: StageKey; size: number }): React.ReactElement {
  const common = {
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
  switch (stage) {
    case "analyze":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.3-4.3" />
          <path d="M8.5 11h5M11 8.5v5" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="7.5" height="14" rx="1.5" />
          <rect x="13.5" y="5" width="7.5" height="14" rx="1.5" />
          <path d="M6.75 9v6M17.25 9v6M15 12h4.5" />
        </svg>
      );
    case "correlate":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="19" cy="6" r="2.5" />
          <circle cx="19" cy="18" r="2.5" />
          <path d="M7.3 10.8 16.7 7.2M7.3 13.2l9.4 3.6" />
        </svg>
      );
    case "enrich":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
          <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      );
  }
}

function StageCard({ stage }: { stage: Stage }): React.ReactElement {
  return (
    <div
      className="relative flex h-full flex-col bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{
        borderRadius: "var(--radius-cs-card)",
        border: `1px solid color-mix(in srgb, ${stage.accent} 22%, #e8e8f0)`,
        boxShadow: `0 1px 2px rgba(17,24,39,0.04), 0 22px 44px -30px color-mix(in srgb, ${stage.accent} 70%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between">
        <GlassIcon accent={stage.accent} size={48}>
          <StageGlyph stage={stage.key} size={24} />
        </GlassIcon>
        <span
          className="font-display"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
            fontSize: "var(--fs-caption)",
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: `color-mix(in srgb, ${stage.accent} 75%, ${INK})`,
          }}
        >
          {stage.index}
        </span>
      </div>
      <h3
        className="mt-5 font-display"
        style={{ fontSize: "var(--fs-h4)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, color: INK }}
      >
        {stage.title}
      </h3>
      <p
        className="mt-2 font-sans"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, letterSpacing: "-0.01em", color: INK_MUTED }}
      >
        {stage.desc}
      </p>
    </div>
  );
}

/** The terminal: a dark card carrying the three verdict states. */
function VerdictTerminal(): React.ReactElement {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden p-6 text-white"
      style={{
        borderRadius: "var(--radius-cs-card)",
        background: "linear-gradient(160deg, #1a1633 0%, #0e1040 55%, #1d1660 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 60px -32px rgba(19,30,143,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(154,81,255,0.45), rgba(154,81,255,0))", filter: "blur(10px)" }}
      />
      <div className="relative flex items-center justify-between">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{
            background: "linear-gradient(145deg, rgba(154,81,255,0.55) 0%, rgba(44,193,235,0.35) 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </span>
        <span
          className="font-display text-white/60"
          style={{ fontSize: "var(--fs-badge)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          Output
        </span>
      </div>
      <h3
        className="relative mt-5 font-display"
        style={{ fontSize: "var(--fs-h4)", fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.2, textTransform: "uppercase" }}
      >
        Verdict
      </h3>
      <ul className="relative mt-4 flex flex-col gap-2" aria-label="Possible verdicts">
        {OUTCOMES.map((o) => (
          <li
            key={o.label}
            className="flex items-center gap-2.5 rounded-full px-3 py-1.5 font-display"
            style={{
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: `color-mix(in srgb, ${o.color} 14%, transparent)`,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${o.color} 40%, transparent)`,
            }}
          >
            <span aria-hidden className="block h-[7px] w-[7px] rounded-full" style={{ background: o.color, boxShadow: `0 0 10px ${o.color}` }} />
            {o.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Connector(): React.ReactElement {
  return (
    <div aria-hidden className="hidden items-center justify-center lg:flex" style={{ width: "22px" }}>
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="#b8b6cc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 7h18" />
        <path d="m14 2 5 5-5 5" />
      </svg>
    </div>
  );
}

export function TricorderPipeline(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 85% 10%, rgba(124,92,247,0.07) 0%, transparent 55%), radial-gradient(110% 80% at 8% 90%, rgba(30,111,232,0.07) 0%, transparent 50%), #ffffff",
      }}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static keyframes string, no user input */}
      <style dangerouslySetInnerHTML={{ __html: RAIL_CSS }} />
      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[800px] text-center">
            <h2
              className="font-display"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, color: INK }}
            >
              From{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(102deg, #2cc1eb 0%, #9a51ff 100%)" }}
              >
                Signals
              </span>{" "}
              to Verdicts.
            </h2>
            <p
              className="mx-auto mt-6 max-w-[720px] font-sans"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance", color: INK_MUTED }}
            >
              Tricorder combines behavioral analysis, package history,
              cross-package signals, and threat intelligence to produce a
              security verdict.
            </p>
          </div>
        </Reveal>

        <div className="relative mx-auto mt-12 max-w-[1240px] lg:mt-16">
          {/* The rail — runs under the whole row on desktop, with a travelling pulse. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 -bottom-6 hidden h-[2px] select-none overflow-hidden rounded-full lg:block"
            style={{
              background: `linear-gradient(90deg, ${SIGNAL.behavior}66, ${SIGNAL.history}66, ${SIGNAL.relationships}66, ${SIGNAL.intel}66, ${VERDICT.malicious}66)`,
            }}
          >
            <div className="cs-tri-rail-pulse absolute inset-0" />
          </div>

          <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_22px_minmax(0,1.05fr)] lg:gap-4">
            {STAGES.map((s) => (
              <RevealItem key={s.key} className="h-full">
                <StageCard stage={s} />
              </RevealItem>
            ))}
            <Connector />
            <RevealItem className="h-full sm:col-span-2 lg:col-span-1">
              <VerdictTerminal />
            </RevealItem>
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
