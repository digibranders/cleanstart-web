import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";

type IconKey = "repository" | "validation" | "ai" | "policy";

/** One governance pillar — accent drives the piece stroke, icon, and title underline. */
interface GovernanceCard {
  icon: IconKey;
  title: string;
  body: string;
  accent: string;
  tint: string;
}

/** Order is significant: index 0=TL, 1=TR, 2=BL, 3=BR in the puzzle grid. */
const CARDS: GovernanceCard[] = [
  {
    icon: "repository",
    title: "Validated Repository",
    body: "Curated packages from trusted sources.",
    accent: "#7c3aed",
    tint: "rgba(124,58,237,0.09)",
  },
  {
    icon: "validation",
    title: "Dependency Validation",
    body: "Review and validate dependencies before adoption.",
    accent: "#0d9488",
    tint: "rgba(13,148,136,0.09)",
  },
  {
    icon: "ai",
    title: "AI Dependency Accountability",
    body: "Review dependencies introduced by AI coding tools.",
    accent: "#2563eb",
    tint: "rgba(37,99,235,0.09)",
  },
  {
    icon: "policy",
    title: "Continuous Policy Enforcement",
    body: "Apply dependency policies throughout software delivery.",
    accent: "#ea580c",
    tint: "rgba(234,88,12,0.09)",
  },
];

/** Line icons — stroke inherits the card accent via currentColor. */
function PillarIcon({ icon }: { icon: IconKey }): React.ReactElement {
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "repository":
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.27 6.96 8.73 5.04 8.73-5.04" />
          <path d="M12 22.08V12" />
        </svg>
      );
    case "validation":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          <path d="M19 3v4" />
          <path d="M21 5h-4" />
        </svg>
      );
    case "policy":
      return (
        <svg {...common}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
  }
}

/** Thin hairline divider — a CSS gradient line that fades at both ends, the
 *  same approach as the Pipeline section's dividers (renders in every browser),
 *  toned for the light section. */
function Hairline({
  width = 72,
  color = "#1e293b",
  className,
}: {
  width?: number;
  color?: string;
  className?: string;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: `${width}px`,
        height: "1.5px",
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
      }}
    />
  );
}

/* ---- Jigsaw geometry --------------------------------------------------- *
 * 550×554 canvas, four quadrants. Each interior seam carries one tab. To open
 * a uniform channel, every seam edge is offset by GAP/2 into its own piece and
 * the tab is normal-offset: the convex OWNER bulb shrinks (radius − GAP/2) and
 * the concave SOCKET grows (radius + GAP/2) about a SHARED centre, so the bulb
 * sits inside the socket with an even GAP all the way round. `role` = +1 for
 * the owner (convex), −1 for the socket (concave). Tab = rounded-U.          */
const W = 550;
const H = 554;
const CX = W / 2;
const CY = H / 2;
const R = 22; // outer corner radius
const GAP = 10; // channel between pieces
const G = GAP / 2; // per-edge inset
const NK = 20; // nominal neck half-width / bulb radius
const ND = G; // neck depth = inset → socket neck collapses to 0, both read as circles
const FR = 6; // edge-corner fillet radius

/** Horizontal seam edge at line `y` (already inset into the piece). */
function hSeg(xs: number, xe: number, y: number, s: number, role: number): string {
  if (!s) return ` L ${xe} ${y}`;
  const dir = Math.sign(xe - xs);
  const m = (xs + xe) / 2;
  const r = NK - role * G; // owner shrinks, socket grows
  const cy = y + s * (ND + role * G); // shared bulb centre (nominal seam + s·ND)
  const xn = m - dir * r;
  const xf = m + dir * r;
  const sweep = s > 0 ? (dir > 0 ? 0 : 1) : dir > 0 ? 1 : 0;
  return (
    ` L ${m - dir * (r + FR)} ${y}` +
    ` Q ${xn} ${y} ${xn} ${y + s * FR}` +
    ` L ${xn} ${cy}` +
    ` A ${r} ${r} 0 0 ${sweep} ${xf} ${cy}` +
    ` L ${xf} ${y + s * FR}` +
    ` Q ${xf} ${y} ${m + dir * (r + FR)} ${y}` +
    ` L ${xe} ${y}`
  );
}

/** Vertical seam edge at line `x` (already inset into the piece). */
function vSeg(x: number, ys: number, ye: number, s: number, role: number): string {
  if (!s) return ` L ${x} ${ye}`;
  const dir = Math.sign(ye - ys);
  const m = (ys + ye) / 2;
  const r = NK - role * G;
  const cx = x + s * (ND + role * G);
  const yn = m - dir * r;
  const yf = m + dir * r;
  const sweep = s > 0 ? (dir > 0 ? 1 : 0) : dir > 0 ? 0 : 1;
  return (
    ` L ${x} ${m - dir * (r + FR)}` +
    ` Q ${x} ${yn} ${x + s * FR} ${yn}` +
    ` L ${cx} ${yn}` +
    ` A ${r} ${r} 0 0 ${sweep} ${cx} ${yf}` +
    ` L ${x + s * FR} ${yf}` +
    ` Q ${x} ${yf} ${x} ${m + dir * (r + FR)}` +
    ` L ${x} ${ye}`
  );
}

// Interior seam lines, inset by G into each piece (corners pull back too).
const XL = CX - G; // left-column pieces' right edge
const XR = CX + G; // right-column pieces' left edge
const YT = CY - G; // top-row pieces' bottom edge
const YB = CY + G; // bottom-row pieces' top edge

// Convex owners drawn last per seam so each knob keeps its owner's colour.
const PIECE_PATHS = [
  // TL — right tab OWNER(+x), bottom tab OWNER(+y); rounded corner (0,0)
  `M ${R} 0${hSeg(R, XL, 0, 0, 1)}${vSeg(XL, 0, YT, 1, 1)}${hSeg(XL, 0, YT, 1, 1)} L 0 ${YT} L 0 ${R} Q 0 0 ${R} 0 Z`,
  // TR — left seam SOCKET(+x), bottom seam SOCKET(-y); rounded corner (550,0)
  `M ${XR} 0 L ${W - R} 0 Q ${W} 0 ${W} ${R} L ${W} ${YT}${hSeg(W, XR, YT, -1, -1)}${vSeg(XR, YT, 0, 1, -1)} Z`,
  // BL — top seam SOCKET(+y), right tab OWNER(+x); rounded corner (0,554)
  `M 0 ${YB}${hSeg(0, XL, YB, 1, -1)}${vSeg(XL, YB, H, 1, 1)} L ${R} ${H} Q 0 ${H} 0 ${H - R} L 0 ${YB} Z`,
  // BR — top tab OWNER(-y), left seam SOCKET(+x); rounded corner (550,554)
  `M ${XR} ${YB}${hSeg(XR, W, YB, -1, 1)} L ${W} ${H - R} Q ${W} ${H} ${W - R} ${H} L ${XR} ${H}${vSeg(XR, H, YB, 1, -1)} Z`,
];

// Paint order: sockets first, convex owners last (TR, BR, BL, TL).
const PAINT_ORDER = [1, 3, 2, 0] as const;

function PuzzleDesktop(): React.ReactElement {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <svg
        viewBox={`-2 -2 ${W + 4} ${H + 4}`}
        className="block h-auto w-full"
        role="presentation"
        aria-hidden
        style={{ filter: "drop-shadow(0 14px 30px rgba(17,24,39,0.10))" }}
      >
        {PAINT_ORDER.map((i) => {
          const card = CARDS[i];
          const d = PIECE_PATHS[i];
          if (!card || !d) return null;
          return (
            <path
              key={card.title}
              d={d}
              style={{ fill: `color-mix(in srgb, ${card.accent} 5%, #ffffff)` }}
              stroke={card.accent}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Content overlay — one cell per quadrant. Right-column pieces get extra
          left padding so the incoming side-knob never sits under the text. */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {CARDS.map((card, i) => {
          const rightColumn = i === 1 || i === 3;
          return (
            <div
              key={card.title}
              className={`flex flex-col gap-3 pt-7 ${
                rightColumn ? "pl-[68px] pr-5" : "pl-8 pr-10"
              }`}
            >
              <span
                className="flex size-[52px] items-center justify-center rounded-[14px] border"
                style={{
                  color: card.accent,
                  borderColor: `color-mix(in srgb, ${card.accent} 30%, transparent)`,
                  backgroundColor: card.tint,
                }}
              >
                <PillarIcon icon={card.icon} />
              </span>
              <h3
                className="font-display text-[#111]"
                style={{
                  fontSize: "var(--fs-h3)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {card.title}
              </h3>
              <Hairline width={56} />
              <p
                className="max-w-[190px] font-sans text-[#555]"
                style={{
                  fontSize: "var(--fs-body-sm)",
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.45,
                }}
              >
                {card.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Stacked card fallback for < lg, where the jigsaw would clip text. */
function MobileCard({ card }: { card: GovernanceCard }): React.ReactElement {
  return (
    <div
      className="flex h-full flex-col gap-4 rounded-[24px] border bg-white p-7"
      style={{
        borderColor: `color-mix(in srgb, ${card.accent} 30%, transparent)`,
        boxShadow: "0 14px 30px rgba(17,24,39,0.08)",
      }}
    >
      <span
        className="flex size-[56px] items-center justify-center rounded-[16px] border"
        style={{
          color: card.accent,
          borderColor: `color-mix(in srgb, ${card.accent} 30%, transparent)`,
          backgroundColor: card.tint,
        }}
      >
        <PillarIcon icon={card.icon} />
      </span>
      <h3
        className="font-display text-[#111]"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.12,
        }}
      >
        {card.title}
      </h3>
      <Hairline width={56} />
      <p
        className="font-sans text-[#555]"
        style={{
          fontSize: "var(--fs-body-sm)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.5,
        }}
      >
        {card.body}
      </p>
    </div>
  );
}

export function LibrariesGovernance(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f5f6fb 100%)",
      }}
    >
      {/* Top-right corner accent — ellipse blob gradient + SVG gridlines. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "calc(20 / 1920 * 100%)",
          top: "-316px",
          width: "826px",
          height: "826px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.07,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/deal-registration/ecosystems-corner-grid.svg"
        alt=""
        className="pointer-events-none absolute right-0 top-0 hidden select-none lg:block"
        style={{ width: "366px", height: "369px" }}
        loading="lazy"
        decoding="async"
      />
      {/* Bottom-left corner accent — ellipse blob gradient + mirrored gridlines. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "calc(20 / 1920 * 100%)",
          bottom: "-316px",
          width: "826px",
          height: "826px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #2cc1eb 0%, rgba(44,193,235,0) 100%)",
          opacity: 0.07,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/deal-registration/ecosystems-corner-grid.svg"
        alt=""
        className="pointer-events-none absolute bottom-0 left-0 hidden select-none lg:block"
        style={{ width: "366px", height: "369px", transform: "scale(-1, -1)" }}
        loading="lazy"
        decoding="async"
      />
      <Container className="relative">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-12">
          <Reveal>
            <div className="text-center lg:text-left">
              <h2
                className="font-display text-[#111]"
                style={{
                  fontSize: "var(--fs-h2)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Trusted Dependency Governance
              </h2>
              <Hairline
                width={132}
                color="#000000"
                className="mx-auto mt-7 lg:mx-0"
              />
              <p
                className="mx-auto mt-6 max-w-[420px] font-sans text-[#555] lg:mx-0"
                style={{
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.5,
                }}
              >
                Validate, govern, and enforce software dependencies before they
                reach production.
              </p>
            </div>
          </Reveal>

          <Reveal className="hidden lg:block">
            <PuzzleDesktop />
          </Reveal>

          <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:hidden">
            {CARDS.map((card) => (
              <RevealItem key={card.title}>
                <MobileCard card={card} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
