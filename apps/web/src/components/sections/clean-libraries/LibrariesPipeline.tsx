import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

/** Top-of-orb-or-side corner card describing one dependency entry path. */
interface EntryCard {
  title: string;
  items: string[];
  border: string;
  tint: string;
}

const ENTRY_CARDS: EntryCard[] = [
  {
    title: "Developer Added",
    items: ["requests", "numpy", "axios"],
    border: "#c071f8",
    tint: "rgba(192,113,248,0.1)",
  },
  {
    title: "Open-Source",
    items: ["react", "express", "lodash"],
    border: "#14f2e4",
    tint: "rgba(20,240,230,0.1)",
  },
  {
    title: "AI-Introduced",
    items: ["helper-sdk", "analytics-plus", "agent-framework"],
    border: "#57d5fb",
    tint: "rgba(87,213,251,0.1)",
  },
  {
    title: "Transitive",
    items: ["dep-a", "dep-b", "dep-c"],
    border: "#fc856f",
    tint: "rgba(253,148,110,0.1)",
  },
];

interface Outcome {
  icon: string;
  label: string;
}

const OUTCOMES: Outcome[] = [
  { icon: "/images/clean-libraries/out-visibility.svg", label: "Complete Dependency Visibility" },
  { icon: "/images/clean-libraries/out-risk.svg", label: "Reduced Dependency Risk" },
  { icon: "/images/clean-libraries/out-accountability.svg", label: "AI Dependency Accountability" },
  { icon: "/images/clean-libraries/out-policy1.svg", label: "Continuous Policy Enforcement" },
  { icon: "/images/clean-libraries/out-policy2.svg", label: "Continuous Policy Enforcement" },
];

const BALL_BG = "linear-gradient(180deg, #239cff 0%, #005be3 100%)";
const BALL_SHADOW =
  "0px 4.6px 10.9px 0px rgba(28,60,142,0.33), inset 0px -0.175px 0.218px 0px rgba(0,44,179,0.5), inset 0px 0.087px 0.436px 0px rgba(255,255,255,0.81)";
const DIVIDER =
  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%)";

/** Corner card content — fonts come from the role-token system, not Figma px. */
function CardBody({ card }: { card: EntryCard }): React.ReactElement {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[20px] border px-5 text-center text-white"
      style={{
        borderColor: card.border,
        background: `linear-gradient(125.6deg, ${card.tint} 4.65%, rgba(153,153,153,0.1) 77.64%)`,
      }}
    >
      <p
        className="font-display font-bold"
        style={{ fontSize: "var(--fs-h4)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
      >
        {card.title}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {card.items.map((item) => (
          <li
            key={item}
            className="rounded-full border font-mono leading-none"
            style={{
              borderColor: card.border,
              backgroundColor: card.tint,
              color: "rgba(255,255,255,0.92)",
              fontSize: "var(--fs-caption)",
              letterSpacing: "-0.01em",
              padding: "4px 8px",
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Diagram geometry in the 1276×420 design canvas. */
const ORB = { cx: 638, cy: 210, r: 194 } as const; // r=194 → tips meet the sphere, just inside the 420px glow halo
const CARD = { w: 250, h: 128 } as const;

/** Card corner positions in the 1276×420 design space, paired by index with ENTRY_CARDS. */
const CARD_POSITIONS = [
  { left: 120, top: 0 }, // Developer Added (TL)
  { left: 906, top: 0 }, // Open Source (TR)
  { left: 120, top: 292 }, // AI-Introduced (BL)
  { left: 906, top: 292 }, // Transitive (BR)
] as const;

/** Per-card connector accent colour, paired by index with ENTRY_CARDS / CARD_POSITIONS. */
const CONNECTOR_META = [
  { color: "#c071f8" }, // Developer Added (TL)
  { color: "#14f2e4" }, // Open-Source (TR)
  { color: "#57d5fb" }, // AI-Introduced (BL)
  { color: "#fc856f" }, // Transitive (BR)
] as const;

// The orb dock sits on the orb's near side, offset ATTACH_DY above/below centre —
// matching the original artwork, where arrows entered the orb roughly horizontally
// rather than along the 45° diagonal.
const ATTACH_DY = 85;
const ATTACH_DX = Math.sqrt(ORB.r ** 2 - ATTACH_DY ** 2); // x on the perimeter at that height

interface CardPos {
  left: number;
  top: number;
}

interface ConnectorPath {
  d: string;
  color: string;
}

/**
 * Build an ogee (S-shaped) cubic from a card's inner edge to the orb's near side.
 * Both control points sit on the horizontal midline, so the curve leaves the card
 * and enters the orb on horizontal tangents with a vertical sweep between — the
 * shape of the original connector artwork. Endpoints are exact, so there is no gap.
 */
function buildConnector(pos: CardPos, meta: (typeof CONNECTOR_META)[number]): ConnectorPath {
  const onLeft = pos.left < ORB.cx;
  const startX = onLeft ? pos.left + CARD.w : pos.left;
  const startY = pos.top + CARD.h / 2;

  const endX = ORB.cx + (onLeft ? -ATTACH_DX : ATTACH_DX);
  const endY = ORB.cy + (startY < ORB.cy ? -ATTACH_DY : ATTACH_DY);

  const midX = (startX + endX) / 2;

  const r = (n: number): string => n.toFixed(1);
  return {
    color: meta.color,
    d: `M ${r(startX)} ${r(startY)} C ${r(midX)} ${r(startY)}, ${r(midX)} ${r(endY)}, ${r(endX)} ${r(endY)}`,
  };
}

/** Desktop diagram — a 1276×544 design canvas scaled uniformly to fit. */
function DesktopDiagram(): React.ReactElement {
  const positionedCards = ENTRY_CARDS.map((card, i) => ({
    card,
    pos: CARD_POSITIONS[i] ?? { left: 0, top: 0 },
  }));

  const connectors = CARD_POSITIONS.map((pos, i) =>
    buildConnector(pos, CONNECTOR_META[i] ?? CONNECTOR_META[0]),
  );

  return (
    <div
      className="mx-auto hidden lg:block"
      style={
        {
          "--lib-scale": "min(1, calc((min(100vw, 1440px) - 80px) / 1276px))",
          width: "calc(1276px * var(--lib-scale))",
          height: "calc(420px * var(--lib-scale))",
        } as React.CSSProperties
      }
    >
      <div
        className="relative"
        style={{
          width: "1276px",
          height: "420px",
          transform: "scale(var(--lib-scale))",
          transformOrigin: "top left",
        }}
      >
        {/* Central orb. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/clean-libraries/pipeline-orb.webp"
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 w-[420px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
          loading="lazy"
          decoding="async"
        />

        {/* Curved connectors: card inner edge → orb perimeter, computed for a flush fit. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          viewBox="0 0 1276 420"
          fill="none"
        >
          <defs>
            {CONNECTOR_META.map((m) => (
              <marker
                key={m.color}
                id={`lib-arrow${m.color.slice(1)}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="14"
                markerHeight="14"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M1 1 L9 5 L1 9 Z" fill={m.color} />
              </marker>
            ))}
          </defs>
          {connectors.map((c) => (
            <path
              key={c.color}
              d={c.d}
              stroke={c.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 8"
              markerEnd={`url(#lib-arrow${c.color.slice(1)})`}
              style={{ filter: `drop-shadow(0 0 3px ${c.color}99)` }}
            />
          ))}
        </svg>

        {/* Corner cards. */}
        {positionedCards.map(({ card, pos }) => (
          <div
            key={card.title}
            className="absolute"
            style={{
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              width: `${CARD.w}px`,
              height: `${CARD.h}px`,
            }}
          >
            <CardBody card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked mobile/tablet layout — orb above a 2-col card grid. */
function MobileDiagram(): React.ReactElement {
  return (
    <div className="lg:hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/clean-libraries/pipeline-orb.webp"
        alt=""
        className="pointer-events-none mx-auto block w-full max-w-[360px] select-none"
        loading="lazy"
        decoding="async"
      />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ENTRY_CARDS.map((card) => (
          <div key={card.title} className="min-h-[140px]">
            <CardBody card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibrariesPipeline(): React.ReactElement {
  return (
    <Section
      padding="sm"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0a0826 0%, #0d0a30 50%, #0a0826 100%)",
      }}
    >
      {/* Central purple glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(110,64,255,0.22) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        <Reveal header>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-center lg:gap-12">
            <h2
              className="text-center font-display text-white lg:text-left"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              The Invisible Dependency{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)",
                }}
              >
                Pipeline
              </span>
            </h2>
            <p
              className="text-center font-sans text-white/80 lg:text-left"
              style={{
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
              }}
            >
              Dependencies can enter your software supply chain through
              developers, AI coding assistants, open-source packages, and
              transitive dependencies long before they are reviewed.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 lg:mt-16">
          <DesktopDiagram />
          <MobileDiagram />
        </div>

        {/* "No review" banner — width matches the diagram canvas above. */}
        <Reveal>
          <div
            className="mx-auto mt-12 lg:mt-16 lg:w-[calc(1036px*var(--lib-scale))]"
            style={
              {
                "--lib-scale":
                  "min(1, calc((min(100vw, 1440px) - 80px) / 1276px))",
              } as React.CSSProperties
            }
          >
            <div
              className="flex flex-col items-center gap-5 rounded-[24px] border px-6 py-5 text-center md:flex-row md:gap-8 md:px-10 md:text-left"
              style={{
                borderColor: "rgba(154,81,255,0.4)",
                background:
                  "linear-gradient(125.6deg, rgba(154,81,255,0.12) 0%, rgba(44,193,235,0.08) 100%)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                aria-hidden
                src="/images/clean-libraries/banner-hex.svg"
                alt=""
                className="pointer-events-none size-[84px] shrink-0 select-none"
                loading="lazy"
                decoding="async"
              />
              <p
                className="font-display font-bold text-white"
                style={{
                  fontSize: "var(--fs-h3)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                No review. No approval. No visibility.
              </p>
              <div
                aria-hidden
                className="hidden h-[64px] w-px shrink-0 md:block"
                style={{ background: DIVIDER }}
              />
              <p
                className="max-w-[420px] font-sans text-white/80"
                style={{
                  fontSize: "var(--fs-body)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                Dependencies can become a permanent part of your software before
                anyone knows they exist.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Outcome row. */}
        <div
          aria-hidden
          className="mt-12 h-px w-full lg:mt-16"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div className="mt-12 grid grid-cols-2 items-start gap-x-4 gap-y-10 sm:grid-cols-3 lg:flex lg:justify-between lg:gap-0">
          {OUTCOMES.map((o, i) => (
            <div key={`${o.label}-${i}`} className="contents lg:flex lg:items-start">
              <div className="flex flex-col items-center gap-5 px-2 text-center lg:w-[204px]">
                <div
                  className="flex size-[62px] items-center justify-center rounded-full"
                  style={{ background: BALL_BG, boxShadow: BALL_SHADOW }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    aria-hidden
                    src={o.icon}
                    alt=""
                    className="pointer-events-none size-10 select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p
                  className="font-display font-bold text-white"
                  style={{
                    fontSize: "var(--fs-h4)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {o.label}
                </p>
              </div>
              {i < OUTCOMES.length - 1 && (
                <div
                  aria-hidden
                  className="hidden h-[152px] w-px shrink-0 self-center lg:block"
                  style={{ background: DIVIDER }}
                />
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
