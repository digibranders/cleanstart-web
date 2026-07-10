import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";

type IconKey = "repository" | "search" | "sparkles" | "shield";
type Pos = "tl" | "tr" | "bl" | "br";

interface GovCard {
  key: string;
  icon: IconKey;
  title: string;
  body: string;
  /** Line-icon + divider colour. */
  accent: string;
  /** Straight + curved card border colour. */
  border: string;
  /** Card fill tint (outer-corner gradient start; fades to white). */
  fill: string;
  /** Icon-circle drop-shadow colour. */
  shadow: string;
  /** Body-copy wrap width (px) — tuned per card to match the reference wrap. */
  textMax: number;
  pos: Pos;
}

const CARDS: GovCard[] = [
  {
    key: "repository",
    icon: "repository",
    title: "Trusted Repository",
    body: "Approved libraries from trusted sources.",
    accent: "#6d28d9",
    border: "#d4c6f9",
    fill: "#f6f3fe",
    shadow: "rgba(109,40,217,0.15)",
    textMax: 200,
    pos: "tl",
  },
  {
    key: "validation",
    icon: "search",
    title: "Dependency Validation",
    body: "Validate every library before adoption.",
    accent: "#0f766e",
    border: "#b5e3d8",
    fill: "#eefbf7",
    shadow: "rgba(15,118,110,0.15)",
    textMax: 220,
    pos: "tr",
  },
  {
    key: "ai",
    icon: "sparkles",
    title: "AI Controls",
    body: "Validate AI-suggested libraries before use.",
    accent: "#1d4ed8",
    border: "#b4c6f4",
    fill: "#eff3fe",
    shadow: "rgba(29,78,216,0.15)",
    textMax: 210,
    pos: "bl",
  },
  {
    key: "policy",
    icon: "shield",
    title: "Policy Enforcement",
    body: "Enforce dependency policies across the software lifecycle.",
    accent: "#ea580c",
    border: "#fcd0a1",
    fill: "#fff5ee",
    shadow: "rgba(234,88,12,0.15)",
    textMax: 240,
    pos: "br",
  },
];

function GovIcon({ icon, size = 30 }: { icon: IconKey; size?: number }): React.ReactElement {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "repository":
      return (
        <svg {...c}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m8.6 12 2.3 2.3 4.7-4.7" />
        </svg>
      );
    case "search":
      return (
        <svg {...c}>
          <circle cx="11" cy="11" r="7.5" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...c}>
          <path d="M12 3 13.8 10.2 21 12 13.8 13.8 12 21 10.2 13.8 3 12 10.2 10.2Z" />
          <path d="M18.5 4 19 6 21 6.5 19 7 18.5 9 18 7 16 6.5 18 6Z" />
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

function IconCircle({
  accent,
  shadow,
  icon,
  size = 64,
  glyph = 30,
}: {
  accent: string;
  shadow: string;
  icon: IconKey;
  size?: number;
  glyph?: number;
}): React.ReactElement {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-white"
      style={{ width: size, height: size, color: accent, boxShadow: `0 10px 25px -5px ${shadow}` }}
    >
      <GovIcon icon={icon} size={glyph} />
    </div>
  );
}

/**
 * Icon beside title, with the divider + body stacked in a column to the right of
 * the icon — the horizontal content layout from the reference.
 */
function CardBody({ card }: { card: GovCard }): React.ReactElement {
  return (
    <div className="flex items-start gap-5">
      <IconCircle accent={card.accent} shadow={card.shadow} icon={card.icon} />
      <div className="flex flex-col">
        <h3
          className="font-display text-[#0f172a]"
          style={{
            fontSize: "var(--fs-h3)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            maxWidth: "170px",
          }}
        >
          {card.title}
        </h3>
        <span aria-hidden className="mt-3 block h-[3px] w-6 rounded-full" style={{ background: card.accent }} />
        <p
          className="mt-4 font-sans text-[#475569]"
          style={{ fontSize: "var(--fs-body-sm)", fontWeight: 400, lineHeight: 1.5, maxWidth: `${card.textMax}px` }}
        >
          {card.body}
        </p>
      </div>
    </div>
  );
}

/* --- Desktop card geometry (fixed 1000×540 canvas, scaled to fit) --- */
const CANVAS_W = 1000;
const CANVAS_H = 540;
const GAP = 32;
const CARD_W = (CANVAS_W - GAP) / 2; // 484
const CARD_H = (CANVAS_H - GAP) / 2; // 254
const RC = 24; // outer corner radius
const SCOOP_R = 140; // concave scoop radius (arc hugs the hub)
const FILLET = 24; // convex fillet that eases the straight edge into the scoop
const BW = 1.5; // border width

/**
 * Card outline with a *filleted* concave notch at the bottom-right corner.
 * The straight edges ease into the scoop through small convex fillets (radius
 * `FILLET`) so the transition is soft — no sharp kink where edge meets arc.
 * Other corners are produced by reflecting this path (see NOTCH_TRANSFORM).
 */
function bottomRightNotchPath(): string {
  const W = CARD_W;
  const H = CARD_H;
  const R = SCOOP_R;
  const f = FILLET;
  const rc = RC;
  const D = Math.sqrt(R * R + 2 * R * f); // edge distance from corner to fillet start
  const r2 = (n: number): number => Math.round(n * 100) / 100;
  const yA = r2(H - D);
  const xB = r2(W - D);
  const t1x = r2(W - (R * f) / (R + f));
  const t1y = r2(H - (R * D) / (R + f));
  const t2x = r2(W - (R * D) / (R + f));
  const t2y = r2(H - (R * f) / (R + f));
  return [
    `M ${rc} 0`,
    `L ${W - rc} 0`,
    `A ${rc} ${rc} 0 0 1 ${W} ${rc}`,
    `L ${W} ${yA}`,
    `A ${f} ${f} 0 0 1 ${t1x} ${t1y}`, // convex fillet into the scoop
    `A ${R} ${R} 0 0 0 ${t2x} ${t2y}`, // concave scoop hugging the hub
    `A ${f} ${f} 0 0 1 ${xB} ${H}`, // convex fillet back to the edge
    `L ${rc} ${H}`,
    `A ${rc} ${rc} 0 0 1 0 ${H - rc}`,
    `L 0 ${rc}`,
    `A ${rc} ${rc} 0 0 1 ${rc} 0`,
    "Z",
  ].join(" ");
}

const NOTCH_PATH = bottomRightNotchPath();

/** Reflect the bottom-right notch onto each card's inner corner. */
const NOTCH_TRANSFORM: Record<Pos, string | undefined> = {
  tl: undefined, // notch bottom-right
  tr: `translate(${CARD_W} 0) scale(-1 1)`, // notch bottom-left
  bl: `translate(0 ${CARD_H}) scale(1 -1)`, // notch top-right
  br: `translate(${CARD_W} ${CARD_H}) scale(-1 -1)`, // notch top-left
};

/** Vertical (justify) + horizontal indent so content radiates to the outer corner. */
const CONTENT_POS: Record<Pos, { justify: string; indent: boolean }> = {
  tl: { justify: "justify-start", indent: false },
  tr: { justify: "justify-start", indent: true },
  bl: { justify: "justify-end", indent: false },
  br: { justify: "justify-end", indent: true },
};

function GovCardDesktop({ card }: { card: GovCard }): React.ReactElement {
  const place = CONTENT_POS[card.pos];
  const gid = `gov-fill-${card.key}`;
  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0.55" y2="1">
            <stop offset="0%" stopColor={card.fill} />
            <stop offset="62%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <path
          d={NOTCH_PATH}
          transform={NOTCH_TRANSFORM[card.pos]}
          fill={`url(#${gid})`}
          stroke={card.border}
          strokeWidth={BW}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className={`relative z-[3] flex h-full w-full flex-col ${place.justify}`}
        style={{ padding: "36px 44px" }}
      >
        <div className={place.indent ? "pl-[60px]" : ""}>
          <CardBody card={card} />
        </div>
      </div>
    </div>
  );
}

/** A pillar card in the mobile governance flow — full width with an accent left rail. */
function GovCardFlow({ card }: { card: GovCard }): React.ReactElement {
  return (
    <div
      className="w-full rounded-[20px] p-6"
      style={{
        background: `linear-gradient(150deg, ${card.fill} 0%, #ffffff 62%)`,
        border: `${BW}px solid ${card.border}`,
        borderLeftWidth: "4px",
        borderLeftColor: card.accent,
      }}
    >
      <CardBody card={card} />
    </div>
  );
}

/**
 * A segment of the mobile "governance spine" — a vertical connector line linking
 * the hub to each pillar card, with an optional accent node where a card joins.
 */
function FlowConnector({ accent }: { accent?: string }): React.ReactElement {
  return (
    <div className="relative flex h-9 items-center justify-center" aria-hidden>
      <span
        className="absolute inset-y-0 w-[2px] rounded-full"
        style={{ background: "linear-gradient(180deg, #d7deee 0%, #c3cde3 100%)" }}
      />
      {accent ? (
        <span
          className="relative size-2.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 0 5px color-mix(in srgb, ${accent} 12%, transparent)` }}
        />
      ) : null}
    </div>
  );
}

function Hub({ size = 230 }: { size?: number }): React.ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-full bg-white text-center"
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 0 12px rgba(255,255,255,0.4), 0 20px 40px -10px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="mb-3 flex size-14 items-center justify-center rounded-full bg-white"
        style={{ color: "#6d28d9", border: "2px solid #f3e8ff" }}
      >
        <GovIcon icon="shield" size={28} />
      </div>
      <span
        className="font-display text-[#0f172a]"
        style={{ fontSize: "var(--fs-body)", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: "132px" }}
      >
        Software Dependency Governance
      </span>
    </div>
  );
}

function DiagramDesktop(): React.ReactElement {
  return (
    <div
      className="relative mx-auto hidden w-full max-w-[1000px] md:block"
      style={{ aspectRatio: "1000 / 540", containerType: "inline-size" }}
    >
      <div
        className="absolute left-0 top-0"
        style={
          {
            width: 1000,
            height: 540,
            transformOrigin: "top left",
            transform: "scale(var(--gov-scale))",
            "--gov-scale": "min(1, 100cqw / 1000)",
          } as React.CSSProperties
        }
      >
        <RevealStagger className="grid h-full w-full grid-cols-2 grid-rows-2 gap-8">
          {CARDS.map((card) => (
            <RevealItem key={card.key} className="h-full">
              <GovCardDesktop card={card} />
            </RevealItem>
          ))}
        </RevealStagger>
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <Reveal header y={0} duration={0.6}>
            <Hub />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function DiagramMobile(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center md:hidden">
      <Reveal header y={0} duration={0.6}>
        <Hub size={150} />
      </Reveal>
      <FlowConnector />
      <RevealStagger className="flex w-full flex-col items-center">
        {CARDS.map((card, i) => (
          <RevealItem key={card.key} className="w-full">
            {i > 0 ? <FlowConnector accent={card.accent} /> : null}
            <GovCardFlow card={card} />
          </RevealItem>
        ))}
      </RevealStagger>
    </div>
  );
}

export function LibrariesGovernance(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)" }}
    >
      <Container className="relative">
        <Reveal header>
          <div className="text-center">
            <h2
              className="mx-auto max-w-[640px] font-display text-[#0f172a]"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.12 }}
            >
              Govern every dependency. Build with confidence.
            </h2>
            <p
              className="mx-auto mt-5 max-w-[840px] font-sans text-[#475569]"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.5, textWrap: "balance" }}
            >
              Clean Libraries enforces policy, validates every dependency, and
              governs AI-suggested libraries across the software lifecycle.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 lg:mt-16">
          <DiagramDesktop />
          <DiagramMobile />
        </div>
      </Container>
    </Section>
  );
}
