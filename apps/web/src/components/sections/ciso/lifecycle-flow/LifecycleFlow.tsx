import type { CSSProperties, ReactNode } from "react";

import {
  VB,
  PALETTE,
  NODES,
  SPOKES,
  RING_LINKS,
  MESH,
  MESH_BBOX,
  HEX_POINTS,
  LEFT_ICON,
  LEFT_ITEMS,
  LEFT_FANS,
  LEFT_SOURCE_DOTS,
  LEFT_MERGE,
  RIGHT_ITEMS,
  RIGHT_FANS,
  RIGHT_TARGET_DOTS,
  RIGHT_BRANCH,
  CARD,
  GOV_PANEL,
  GOV_ITEMS,
  GOV_DIVIDERS,
  GOV_TITLE_Y,
  GOV_ROW_Y,
  pctX,
  pctY,
  pctW,
  pctH,
  cqw,
  type Palette,
  type SideItemDef,
} from "./geometry";
import {
  type IconCmp,
  CodeIcon,
  AiIcon,
  BoxesIcon,
  CubeIcon,
  RegistryIcon,
  CloudIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  TargetIcon,
  EyeIcon,
  FingerprintIcon,
  DocumentIcon,
} from "./icons";

const LEFT_DASH_COLOR = "#B36BFF";
const RIGHT_DASH_COLOR = "#2CC1EB";

/* ------------------------------- primitives ------------------------------- */

/** Glowing circular node that fills its positioned wrapper. */
function NodeBubble({
  palette,
  Icon,
  pulse = false,
  iconScale = 0.46,
}: {
  palette: Palette;
  Icon: IconCmp;
  pulse?: boolean;
  iconScale?: number;
}): React.ReactElement {
  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className={
          pulse
            ? "cs-flow-pulse pointer-events-none absolute rounded-full"
            : "pointer-events-none absolute rounded-full"
        }
        style={{
          inset: "-24%",
          background: `radial-gradient(circle, ${palette.glow} 0%, transparent 68%)`,
        }}
      />
      <div
        className="absolute inset-0 grid place-items-center rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 34%, rgba(255,255,255,0.10) 0%, rgba(9,11,38,0.94) 70%)",
          border: `1.5px solid ${palette.ring}`,
          boxShadow: `0 0 26px 0 ${palette.glow}, inset 0 0 18px ${palette.ring}40`,
        }}
      >
        <span
          aria-hidden
          className="grid place-items-center"
          style={{
            width: `${iconScale * 100}%`,
            height: `${iconScale * 100}%`,
            color: palette.icon,
            filter: `drop-shadow(0 0 5px ${palette.glow})`,
          }}
        >
          <Icon size="100%" />
        </span>
      </div>
    </div>
  );
}

/** Centre-cluster node placed at a view-box centre, with a label beneath. */
function ClusterNode({
  nodeKey,
  Icon,
}: {
  nodeKey: NodeKeyT;
  Icon: IconCmp;
}): React.ReactElement {
  const n = NODES[nodeKey];
  const isHub = nodeKey === "hub";
  return (
    <>
      <div
        className="absolute z-20"
        style={{
          left: pctX(n.cx),
          top: pctY(n.cy),
          width: pctW(2 * n.r),
          aspectRatio: "1",
          transform: "translate(-50%, -50%)",
        }}
      >
        <NodeBubble
          palette={PALETTE[n.pal]}
          Icon={Icon}
          pulse={isHub}
          iconScale={isHub ? 0.5 : 0.46}
        />
      </div>
      <span
        className="absolute z-20 -translate-x-1/2 whitespace-nowrap text-center text-white"
        style={{
          left: pctX(n.cx),
          // Clear the node ring (and, for the hub, its pulsing aura at r+13).
          top: pctY(n.cy + n.r + (isHub ? 22 : 14)),
          fontFamily: "var(--font-sans)",
          fontWeight: isHub ? 600 : 500,
          fontSize: isHub ? "1.3cqw" : "1.16cqw",
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
          textShadow: "0 1px 10px rgba(0,0,0,0.6)",
        }}
      >
        {n.label}
      </span>
    </>
  );
}

type NodeKeyT = keyof typeof NODES;

/** Plain tracked-uppercase column eyebrow (no pill), centred at `cx`. */
function Eyebrow({
  cx,
  color,
  children,
}: {
  cx: number;
  color: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <span
      className="absolute z-20 whitespace-nowrap uppercase"
      style={{
        left: pctX(cx),
        top: pctY(26),
        transform: "translate(-50%, -50%)",
        color,
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: "1.05cqw",
        letterSpacing: "0.16em",
        textShadow: `0 0 14px ${color}55`,
      }}
    >
      {children}
    </span>
  );
}

/** A risk-source row: glowing icon, title + 2-line description. */
function LeftItem({
  item,
  Icon,
}: {
  item: SideItemDef;
  Icon: IconCmp;
}): React.ReactElement {
  return (
    <div
      className="absolute z-20 flex items-center"
      style={{
        left: pctX(LEFT_ICON.cx - LEFT_ICON.r),
        top: pctY(item.cy),
        width: pctW(420),
        transform: "translateY(-50%)",
        gap: "1.1cqw",
      }}
    >
      <div style={{ width: cqw(2 * LEFT_ICON.r), aspectRatio: "1", flexShrink: 0 }}>
        <NodeBubble palette={PALETTE[item.pal]} Icon={Icon} iconScale={0.44} />
      </div>
      <div className="min-w-0">
        <p
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1.26cqw",
            letterSpacing: "-0.01em",
            lineHeight: 1.18,
          }}
        >
          {item.title}
        </p>
        <p
          style={{
            marginTop: "0.25cqw",
            fontFamily: "var(--font-sans)",
            fontSize: "1.02cqw",
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.62)",
          }}
        >
          {item.desc[0]}
          <br />
          {item.desc[1]}
        </p>
      </div>
    </div>
  );
}

/** An operational-impact card: glass panel, icon + title + 2-line description. */
function RightCard({
  item,
  Icon,
}: {
  item: SideItemDef;
  Icon: IconCmp;
}): React.ReactElement {
  return (
    <div
      className="absolute z-20 flex items-center"
      style={{
        left: pctX(CARD.x),
        top: pctY(item.cy),
        width: pctW(CARD.w),
        height: pctH(CARD.h),
        transform: "translateY(-50%)",
        gap: "1cqw",
        padding: "0 1.3cqw",
        borderRadius: "1cqw",
        border: "1px solid rgba(120,160,220,0.22)",
        background:
          "linear-gradient(150deg, rgba(18,24,58,0.55) 0%, rgba(10,13,38,0.55) 100%)",
      }}
    >
      <div style={{ width: cqw(56), aspectRatio: "1", flexShrink: 0 }}>
        <NodeBubble palette={PALETTE[item.pal]} Icon={Icon} iconScale={0.44} />
      </div>
      <div className="min-w-0">
        <p
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1.2cqw",
            letterSpacing: "-0.01em",
            lineHeight: 1.18,
          }}
        >
          {item.title}
        </p>
        <p
          style={{
            marginTop: "0.25cqw",
            fontFamily: "var(--font-sans)",
            fontSize: "0.98cqw",
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.62)",
          }}
        >
          {item.desc[0]}
          <br />
          {item.desc[1]}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- icon maps ------------------------------ */

const CLUSTER_ICONS: Record<NodeKeyT, IconCmp> = {
  hub: RegistryIcon,
  codeRepo: CodeIcon,
  build: CubeIcon,
  deps: ShieldCheckIcon,
  deploy: CloudIcon,
  runtime: ServerStackIcon,
};

const LEFT_ICONS: IconCmp[] = [CodeIcon, AiIcon, BoxesIcon];
const RIGHT_ICONS: IconCmp[] = [ShieldAlertIcon, TargetIcon, ServerStackIcon];
const GOV_ICONS: IconCmp[] = [EyeIcon, FingerprintIcon, ShieldCheckIcon, DocumentIcon];

/* ------------------------------- connectors ------------------------------- */

function Connectors(): React.ReactElement {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 z-0 h-full w-full"
    >
      <defs>
        <pattern id="cisoGrid" width="58" height="58" patternUnits="userSpaceOnUse">
          <path d="M58 0H0V58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>

        <linearGradient
          id="meshGrad"
          gradientUnits="userSpaceOnUse"
          x1={MESH_BBOX.x1}
          y1="0"
          x2={MESH_BBOX.x2}
          y2="0"
        >
          <stop offset="0" stopColor="#9A5BFF" />
          <stop offset="0.5" stopColor="#6E7BFF" />
          <stop offset="1" stopColor="#2CC1EB" />
        </linearGradient>

        {/* Glass body for the system sphere — lit from the upper-left, dimmest
            mid-body, then a slight fresnel lift at the rim for 3D volume. */}
        <radialGradient id="orbBody" cx="46%" cy="32%" r="72%">
          <stop offset="0%" stopColor="rgba(150,134,255,0.26)" />
          <stop offset="44%" stopColor="rgba(74,64,150,0.13)" />
          <stop offset="80%" stopColor="rgba(20,22,60,0.07)" />
          <stop offset="100%" stopColor="rgba(104,86,210,0.17)" />
        </radialGradient>
        <filter id="orbSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" />
        </filter>

        {SPOKES.map((s, i) => (
          <linearGradient
            key={i}
            id={`cisoSpoke${i}`}
            gradientUnits="userSpaceOnUse"
            x1={s.a.x}
            y1={s.a.y}
            x2={s.b.x}
            y2={s.b.y}
          >
            <stop offset="0" stopColor={PALETTE[s.pal].ring} />
            <stop offset="1" stopColor={PALETTE.hub.ring} />
          </linearGradient>
        ))}

        <filter id="cisoGlow" x="-12%" y="-40%" width="124%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={VB.w} height={VB.h} fill="url(#cisoGrid)" />

      {(() => {
        const hex = HEX_POINTS.map((p) => p.join(",")).join(" ");
        const inner = HEX_POINTS.map(
          ([x, y]) =>
            `${(MESH.cx + (x - MESH.cx) * 0.95).toFixed(1)},${(MESH.cy + (y - MESH.cy) * 0.95).toFixed(1)}`,
        ).join(" ");
        // Top-left lit edges: left point → top-left → top-right.
        const rimLight = [HEX_POINTS[5], HEX_POINTS[0], HEX_POINTS[1]]
          .map((p) => (p ? p.join(",") : ""))
          .join(" ");
        return (
          <>
            {/* Secure enclave: soft bloom, glass fill, glowing rim, inner
                frame, top-left rim light, and corner accent nodes. */}
            <polygon points={hex} fill="none" stroke="url(#meshGrad)" strokeWidth={6} strokeLinejoin="round" opacity={0.32} filter="url(#orbSoft)" />
            <polygon points={hex} fill="url(#orbBody)" strokeLinejoin="round" />
            <polygon points={hex} fill="none" stroke="url(#meshGrad)" strokeWidth={2.2} strokeLinejoin="round" opacity={0.95} filter="url(#cisoGlow)" />
            <polygon points={inner} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeLinejoin="round" />
            <polyline points={rimLight} fill="none" stroke="rgba(214,224,255,0.5)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} filter="url(#orbSoft)" />
            {[HEX_POINTS[0], HEX_POINTS[1], HEX_POINTS[3], HEX_POINTS[4]].map((p, i) =>
              p ? <circle key={`hc${i}`} cx={p[0]} cy={p[1]} r={2.8} fill="#cbb6ff" filter="url(#cisoGlow)" /> : null,
            )}
          </>
        );
      })()}

      {/* Labeled-node ring (interconnection). */}
      <g fill="none" stroke="url(#meshGrad)" strokeWidth={1.4} strokeLinecap="round" opacity={0.55}>
        {RING_LINKS.map((d, i) => (
          <path key={`rl${i}`} d={d} />
        ))}
      </g>

      {/* Hub aura ring. */}
      <circle
        cx={NODES.hub.cx}
        cy={NODES.hub.cy}
        r={NODES.hub.r + 13}
        fill="none"
        stroke={PALETTE.hub.ring}
        strokeWidth={1}
        opacity={0.42}
        className="cs-flow-pulse"
        style={{ transformOrigin: `${NODES.hub.cx}px ${NODES.hub.cy}px` }}
      />

      {/* Solid glowing spokes (satellite → hub). */}
      <g fill="none" strokeWidth={2.2} strokeLinecap="round" filter="url(#cisoGlow)">
        {SPOKES.map((s, i) => (
          <path key={`sp${i}`} d={s.d} stroke={`url(#cisoSpoke${i})`} />
        ))}
      </g>

      {/* Flowing dashed fans (sources → merge, branch → cards). */}
      <g fill="none" strokeWidth={2.2} strokeLinecap="round" filter="url(#cisoGlow)">
        {LEFT_FANS.map((d, i) => (
          <path key={`lf${i}`} d={d} stroke={LEFT_DASH_COLOR} strokeDasharray="2 9" className="cs-flow-dash" />
        ))}
        {RIGHT_FANS.map((d, i) => (
          <path key={`rf${i}`} d={d} stroke={RIGHT_DASH_COLOR} strokeDasharray="2 9" className="cs-flow-dash" />
        ))}
      </g>

      {/* Rail source/target dots + the I/O ports where the rails meet the
          system sphere's rim. */}
      <g stroke="none">
        {LEFT_SOURCE_DOTS.map((d, i) => (
          <circle key={`ls${i}`} cx={d.x} cy={d.y} r={3.4} fill={LEFT_DASH_COLOR} />
        ))}
        {RIGHT_TARGET_DOTS.map((d, i) => (
          <circle key={`rt${i}`} cx={d.x} cy={d.y} r={3.4} fill={RIGHT_DASH_COLOR} />
        ))}
        <circle cx={LEFT_MERGE.x} cy={LEFT_MERGE.y} r={4.6} fill={LEFT_DASH_COLOR} filter="url(#cisoGlow)" />
        <circle cx={RIGHT_BRANCH.x} cy={RIGHT_BRANCH.y} r={4.6} fill={RIGHT_DASH_COLOR} filter="url(#cisoGlow)" />
      </g>
    </svg>
  );
}

/* ------------------------------- governance ------------------------------- */

function GovernancePanel(): React.ReactElement {
  return (
    <>
      <div
        className="absolute z-10"
        style={{
          left: pctX(GOV_PANEL.x),
          top: pctY(GOV_PANEL.y),
          width: pctW(GOV_PANEL.w),
          height: pctH(GOV_PANEL.h),
          borderRadius: "1.1cqw",
          border: "1px solid rgba(124,108,255,0.32)",
          background:
            "linear-gradient(180deg, rgba(30,26,72,0.42) 0%, rgba(14,16,52,0.42) 100%)",
          boxShadow: "inset 0 0 40px rgba(124,108,255,0.10)",
        }}
      />

      {/* Centred title with flanking hairline rules. */}
      <div
        className="absolute z-20 flex items-center"
        style={{
          left: pctX(GOV_PANEL.x + 28),
          top: pctY(GOV_TITLE_Y),
          width: pctW(GOV_PANEL.w - 56),
          transform: "translateY(-50%)",
          gap: "1.4cqw",
        }}
      >
        <span
          aria-hidden
          className="flex-1"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(150,140,255,0) 0%, rgba(150,140,255,0.45) 100%)",
          }}
        />
        <span
          className="whitespace-nowrap uppercase text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "1.4cqw",
            letterSpacing: "0.14em",
          }}
        >
          Continuous Governance Layer
        </span>
        <span
          aria-hidden
          className="flex-1"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(150,140,255,0.45) 0%, rgba(150,140,255,0) 100%)",
          }}
        />
      </div>

      {/* Vertical dividers between items. */}
      {GOV_DIVIDERS.map((x) => (
        <span
          key={`gd${x}`}
          aria-hidden
          className="absolute z-10"
          style={{
            left: pctX(x),
            top: pctY(GOV_ROW_Y - 34),
            height: pctH(68),
            width: "1px",
            background:
              "linear-gradient(180deg, rgba(150,140,255,0) 0%, rgba(150,140,255,0.3) 50%, rgba(150,140,255,0) 100%)",
          }}
        />
      ))}

      {GOV_ITEMS.map((g, i) => {
        const Icon = GOV_ICONS[i] as IconCmp;
        return (
          <div
            key={g.title}
            className="absolute z-20 flex items-center"
            style={{
              left: pctX(g.cx),
              top: pctY(GOV_ROW_Y),
              width: pctW(252),
              transform: "translateY(-50%)",
              gap: "0.9cqw",
            }}
          >
            <div style={{ width: cqw(54), aspectRatio: "1", flexShrink: 0 }}>
              <NodeBubble palette={PALETTE.purple} Icon={Icon} iconScale={0.46} />
            </div>
            <div className="min-w-0">
              <p
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "1.12cqw",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.18,
                }}
              >
                {g.title}
              </p>
              <p
                style={{
                  marginTop: "0.2cqw",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.94cqw",
                  lineHeight: 1.3,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                {g.desc[0]}
                <br />
                {g.desc[1]}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* --------------------------------- canvas --------------------------------- */

function FlowCanvas(): React.ReactElement {
  const canvasStyle: CSSProperties = {
    maxWidth: `${VB.w}px`,
    aspectRatio: `${VB.w} / ${VB.h}`,
    containerType: "inline-size",
  };
  return (
    <div className="relative mx-auto w-full" style={canvasStyle}>
      <Connectors />

      <Eyebrow cx={169} color="#C58BFF">
        Risk Sources
      </Eyebrow>
      <Eyebrow cx={VB.w / 2} color="#C58BFF">
        Interconnected Software Ecosystem
      </Eyebrow>
      <Eyebrow cx={CARD.x + CARD.w / 2} color="#3FD2EE">
        Operational Impact
      </Eyebrow>

      {LEFT_ITEMS.map((item, i) => (
        <LeftItem key={item.title} item={item} Icon={LEFT_ICONS[i] as IconCmp} />
      ))}

      {(Object.keys(NODES) as NodeKeyT[]).map((k) => (
        <ClusterNode key={k} nodeKey={k} Icon={CLUSTER_ICONS[k]} />
      ))}

      {RIGHT_ITEMS.map((item, i) => (
        <RightCard key={item.title} item={item} Icon={RIGHT_ICONS[i] as IconCmp} />
      ))}

      <GovernancePanel />
    </div>
  );
}

/**
 * Code-built CISO "interconnected software ecosystem" diagram. A fixed-ratio
 * canvas (SVG mesh/connectors + HTML nodes/cards sharing one coordinate space)
 * that scales fluidly with its width. Risk converges from the left rail into
 * the ecosystem, flows through the registry, and diverges into the right-rail
 * impact cards; a governance layer underpins it. Connectors flow and the hub
 * breathes — all motion disabled under `prefers-reduced-motion`.
 */
export function LifecycleFlow(): React.ReactElement {
  return (
    <div
      role="img"
      className="w-full"
      aria-label="Interconnected software ecosystem diagram. Risk sources — open source, AI-generated code, and third-party dependencies — converge into a connected ecosystem of code repositories, build systems, a central artifact registry, deployments, and runtime workloads, then surface as operational impact: compliance drift, operational exposure, and vulnerable workloads. A continuous governance layer underpins it with continuous visibility, provenance and integrity, policy enforcement, and compliance evidence."
    >
      <FlowCanvas />
    </div>
  );
}
