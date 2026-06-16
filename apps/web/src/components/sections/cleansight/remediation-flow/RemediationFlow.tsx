import {
  VB,
  CARD,
  NODES,
  PALETTE,
  PATHS,
  ARROW_HEAD,
  DASH_DOTS,
  pctX,
  pctY,
  pctW,
  type StagePalette,
} from "./geometry";
import { FlowNode, StageLabel, Pill } from "./FlowNode";
import { ImpactCard } from "./ImpactCard";
import {
  ShieldAlertIcon,
  CubeIcon,
  LayersIcon,
  CloudIcon,
} from "./FlowIcons";

type IconCmp = (props: { size?: string | number }) => React.ReactElement;

const pctH = (v: number): string => `${(v / VB.h) * 100}%`;

/* ----------------------------- desktop pieces ----------------------------- */

const NODE_SIZE = `${(100 / VB.w) * 100}cqw`; // node diameter = 100 vb units

function DesktopNode({
  cx,
  cy,
  palette,
  Icon,
}: {
  cx: number;
  cy: number;
  palette: StagePalette;
  Icon: IconCmp;
}): React.ReactElement {
  return (
    <div
      className="absolute z-10"
      style={{
        left: pctX(cx),
        top: pctY(cy),
        width: NODE_SIZE,
        height: NODE_SIZE,
        transform: "translate(-50%, -50%)",
      }}
    >
      <FlowNode palette={palette} pulse className="h-full w-full">
        <Icon size="100%" />
      </FlowNode>
    </div>
  );
}

function DesktopLabel({
  cx,
  cy,
  palette,
  children,
}: {
  cx: number;
  cy: number;
  palette: StagePalette;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="absolute z-10"
      style={{
        left: pctX(cx),
        top: pctY(cy),
        transform: "translate(-50%, -50%)",
        fontSize: "1.18cqw",
      }}
    >
      <StageLabel palette={palette}>{children}</StageLabel>
    </span>
  );
}

function DesktopPill({
  cx,
  cy,
  children,
}: {
  cx: number;
  cy: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="absolute z-10"
      style={{
        left: pctX(cx),
        top: pctY(cy),
        transform: "translate(-50%, -50%)",
      }}
    >
      <Pill style={{ fontSize: "1.02cqw", padding: "0.5cqw 1.05cqw" }}>
        {children}
      </Pill>
    </span>
  );
}

function DesktopConnectors(): React.ReactElement {
  const sw = 2.4;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 z-0 h-full w-full"
    >
      <defs>
        <pattern
          id="flowGrid"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M64 0H0V64"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        </pattern>

        <linearGradient id="flowG1" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="360" y2="0">
          <stop offset="0" stopColor={PALETTE.vuln.ring} />
          <stop offset="1" stopColor={PALETTE.comp.ring} />
        </linearGradient>
        <linearGradient id="flowG2" gradientUnits="userSpaceOnUse" x1="460" y1="0" x2="662" y2="0">
          <stop offset="0" stopColor={PALETTE.comp.ring} />
          <stop offset="1" stopColor={PALETTE.images.ring} />
        </linearGradient>
        <linearGradient id="flowG3" gradientUnits="userSpaceOnUse" x1="712" y1="0" x2="860" y2="0">
          <stop offset="0" stopColor={PALETTE.images.ring} />
          <stop offset="1" stopColor={PALETTE.envs.ring} />
        </linearGradient>
        <linearGradient id="flowG4" gradientUnits="userSpaceOnUse" x1="960" y1="0" x2="1058" y2="0">
          <stop offset="0" stopColor={PALETTE.envs.ring} />
          <stop offset="1" stopColor={PALETTE.impact.ring} />
        </linearGradient>

        <filter id="flowGlow" x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={VB.w} height={VB.h} fill="url(#flowGrid)" />

      <g fill="none" strokeWidth={sw} strokeLinecap="round" filter="url(#flowGlow)">
        <path d={PATHS.vulnComp} stroke="url(#flowG1)" />
        <path d={PATHS.compImgTop} stroke="url(#flowG2)" />
        <path d={PATHS.compImgBot} stroke="url(#flowG2)" />
        <path d={PATHS.imgEnvTop} stroke="url(#flowG3)" strokeDasharray="7 9" className="cs-flow-dash" />
        <path d={PATHS.imgEnvBot} stroke="url(#flowG3)" strokeDasharray="7 9" className="cs-flow-dash" />
        <path d={PATHS.envMergeTop} stroke="url(#flowG4)" />
        <path d={PATHS.envMergeBot} stroke="url(#flowG4)" />
        <path d={PATHS.arrow} stroke="url(#flowG4)" />
        <polygon
          points={`${ARROW_HEAD.tipX},${ARROW_HEAD.y} ${ARROW_HEAD.tipX - 13},${ARROW_HEAD.y - ARROW_HEAD.size} ${ARROW_HEAD.tipX - 13},${ARROW_HEAD.y + ARROW_HEAD.size}`}
          fill={PALETTE.impact.ring}
          stroke="none"
        />
        {DASH_DOTS.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={3.4}
            fill={PALETTE[d.key].ring}
            stroke="none"
          />
        ))}
      </g>
    </svg>
  );
}

function FlowCanvas(): React.ReactElement {
  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth: `${VB.w}px`,
        aspectRatio: `${VB.w} / ${VB.h}`,
        containerType: "inline-size",
      }}
    >
      <DesktopConnectors />

      {/* Stage labels */}
      <DesktopLabel cx={NODES.vuln.cx} cy={38} palette={PALETTE.vuln}>
        Vulnerability
      </DesktopLabel>
      <DesktopLabel cx={NODES.comp.cx} cy={38} palette={PALETTE.comp}>
        Affected Component
      </DesktopLabel>
      <DesktopLabel cx={NODES.imgTop.cx} cy={38} palette={PALETTE.images}>
        Images
      </DesktopLabel>
      <DesktopLabel cx={NODES.envTop.cx} cy={38} palette={PALETTE.envs}>
        Environments
      </DesktopLabel>
      <DesktopLabel cx={CARD.x + CARD.w / 2} cy={30} palette={PALETTE.impact}>
        Impact &amp; Action
      </DesktopLabel>

      {/* Nodes */}
      <DesktopNode cx={NODES.vuln.cx} cy={NODES.vuln.cy} palette={PALETTE.vuln} Icon={ShieldAlertIcon} />
      <DesktopNode cx={NODES.comp.cx} cy={NODES.comp.cy} palette={PALETTE.comp} Icon={CubeIcon} />
      <DesktopNode cx={NODES.imgTop.cx} cy={NODES.imgTop.cy} palette={PALETTE.images} Icon={LayersIcon} />
      <DesktopNode cx={NODES.imgBot.cx} cy={NODES.imgBot.cy} palette={PALETTE.images} Icon={LayersIcon} />
      <DesktopNode cx={NODES.envTop.cx} cy={NODES.envTop.cy} palette={PALETTE.envs} Icon={CloudIcon} />
      <DesktopNode cx={NODES.envBot.cx} cy={NODES.envBot.cy} palette={PALETTE.envs} Icon={CloudIcon} />

      {/* Pills */}
      <DesktopPill cx={NODES.vuln.cx} cy={322}>
        CVE-2024-56171
      </DesktopPill>
      <DesktopPill cx={NODES.comp.cx} cy={322}>
        libxml2
      </DesktopPill>

      {/* Impact card */}
      <div
        className="absolute z-10"
        style={{
          left: pctX(CARD.x),
          top: pctY(CARD.y),
          width: pctW(CARD.w),
          height: pctH(CARD.h),
          fontSize: "1.28cqw",
        }}
      >
        <ImpactCard className="h-full w-full" />
      </div>
    </div>
  );
}

/**
 * Code-built remediation-flow illustration. A fixed-ratio canvas (SVG
 * connectors + HTML nodes/card sharing one coordinate space) that scales
 * fluidly with its width at every breakpoint.
 */
export function RemediationFlow(): React.ReactElement {
  return (
    <div role="img" aria-label="Remediation flow: vulnerability CVE-2024-56171 in the affected component libxml2 is traced across container images and environments to a verified remediation recommendation that reduces risk across affected workloads.">
      <FlowCanvas />
    </div>
  );
}
