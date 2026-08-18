import type React from 'react';

/*
 * FinanceRiskArt — the six stages of the software supply chain, each drawn as
 * the thing it is, for the dark "Risk Enters Long Before Production" band.
 *
 * Follows the proposal's own reference for this section: a chain of objects
 * with risk arriving at every one of them. Rendered in CleanStart's violet→cyan
 * ramp against the dark field rather than the reference's blue/red on white,
 * and as authored isometric SVG — no podiums, no stock-render gloss, no baked
 * lettering.
 *
 * These are deliberately the *untrusted* siblings of the objects in
 * FinanceComponentArt: same projection, same light, but nothing here carries a
 * verification seal, and each object shows the specific way risk gets in —
 * an open box, an unsealed container, a gap in the belt. The terminal object,
 * the institution, is the one thing on the chain that is not a component: it is
 * what everything upstream arrives at.
 */

type Face = { top: string; left: string; right: string };

/** Isometric box: (cx, cy) is the centre of the TOP face. */
function box(cx: number, cy: number, hw: number, hd: number, ht: number): Face {
  return {
    top: `M${cx} ${cy - hd} L${cx + hw} ${cy} L${cx} ${cy + hd} L${cx - hw} ${cy} Z`,
    left: `M${cx - hw} ${cy} L${cx} ${cy + hd} L${cx} ${cy + hd + ht} L${cx - hw} ${cy + ht} Z`,
    right: `M${cx + hw} ${cy} L${cx} ${cy + hd} L${cx} ${cy + hd + ht} L${cx + hw} ${cy + ht} Z`,
  };
}

interface Pal {
  top: string;
  topLo: string;
  left: string;
  right: string;
  edge: string;
}

// Violet → cyan across the chain, tuned for a dark ground.
const PALS: readonly Pal[] = [
  { top: '#A98BFF', topLo: '#7C4FF0', left: '#3D2585', right: '#5936B8', edge: '#CDB6FF' },
  { top: '#8E90F8', topLo: '#5F63E4', left: '#2F3492', right: '#4149B4', edge: '#BDC0FF' },
  { top: '#7391F2', topLo: '#4A73D8', left: '#264093', right: '#3358AE', edge: '#B0C6FF' },
  { top: '#58A6EA', topLo: '#2F80D4', left: '#1C5088', right: '#2769AE', edge: '#A6D4F7' },
  { top: '#45BEE6', topLo: '#1E97C8', left: '#135A78', right: '#187A9C', edge: '#A2E4F8' },
  { top: '#63E0F5', topLo: '#22B6DC', left: '#12667E', right: '#1789A8', edge: '#C2F3FD' },
];

const RISK = '#FF5F5F';

function Shell({
  id,
  label,
  pal,
  children,
}: {
  id: string;
  label: string;
  pal: Pal;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label={label}
      className="cs-fin-riskobj pointer-events-none select-none"
      viewBox="0 0 160 150"
      width="100%"
      height="100%"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}T`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={pal.top} />
          <stop offset="100%" stopColor={pal.topLo} />
        </linearGradient>
        <filter id={`${id}B`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* Ground shadow — one treatment across the whole chain. */}
      <ellipse cx="80" cy="132" rx="42" ry="9" fill="rgba(0,0,0,0.42)" filter={`url(#${id}B)`} />
      {children}
    </svg>
  );
}

function Solid({
  b,
  pal,
  id,
  edge = true,
}: { b: Face; pal: Pal; id: string; edge?: boolean }): React.ReactElement {
  return (
    <>
      <path d={b.left} fill={pal.left} />
      <path d={b.right} fill={pal.right} />
      <path d={b.top} fill={`url(#${id}T)`} />
      {edge ? (
        <path d={b.top} fill="none" stroke={pal.edge} strokeOpacity="0.55" strokeWidth="1.2" />
      ) : null}
    </>
  );
}

/* 1 — Open Source Components: an open crate, contents already escaping. */
export function RiskOpenSource(): React.ReactElement {
  const id = 'fr0';
  const p = PALS[0] as Pal;
  const b = box(80, 74, 40, 22, 32);
  return (
    <Shell
      id={id}
      label="Open source components, drawn as an open crate with contents escaping."
      pal={p}
    >
      <path d={b.left} fill={p.left} />
      <path d={b.right} fill={p.right} />
      {/* Hollow interior — the crate is open, not sealed. */}
      <path d={b.top} fill="#120d2c" />
      <path d={b.top} fill="none" stroke={p.edge} strokeOpacity="0.6" strokeWidth="1.4" />
      {/* Lid flaps, thrown back. */}
      <path d="M40 74 L80 52 L64 38 L26 60 Z" fill={p.right} fillOpacity="0.9" />
      <path d="M120 74 L80 52 L96 38 L134 60 Z" fill={p.left} fillOpacity="0.9" />
      {/* Contents already out of the box. */}
      {[
        { cx: 56, cy: 34, s: 0.5 },
        { cx: 100, cy: 24, s: 0.42 },
        { cx: 82, cy: 44, s: 0.36 },
      ].map((c, i) => (
        <g key={i}>
          <path d={box(c.cx, c.cy, 16 * c.s, 9 * c.s, 10 * c.s).left} fill={p.left} />
          <path d={box(c.cx, c.cy, 16 * c.s, 9 * c.s, 10 * c.s).right} fill={p.right} />
          <path d={box(c.cx, c.cy, 16 * c.s, 9 * c.s, 10 * c.s).top} fill={`url(#${id}T)`} />
        </g>
      ))}
    </Shell>
  );
}

/* 2 — Libraries & Dependencies: plates with links nobody reviewed. */
export function RiskLibraries(): React.ReactElement {
  const id = 'fr1';
  const p = PALS[1] as Pal;
  return (
    <Shell
      id={id}
      label="Libraries and dependencies, drawn as stacked modules wired to unreviewed nodes."
      pal={p}
    >
      <g stroke={p.edge} strokeOpacity="0.45" strokeWidth="1.2">
        <path d="M34 62 L20 44" />
        <path d="M126 62 L140 44" />
        <path d="M34 90 L18 82" />
        <path d="M126 90 L142 82" />
      </g>
      {[
        { cx: 20, cy: 44 },
        { cx: 140, cy: 44 },
        { cx: 18, cy: 82 },
        { cx: 142, cy: 82 },
      ].map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r="4.5" fill={p.top} fillOpacity="0.9" />
      ))}
      {[104, 84, 64].map((cy, i) => (
        <g key={cy}>
          <Solid b={box(80, cy, 40 - i * 4, 22 - i * 2, 11)} pal={p} id={id} />
        </g>
      ))}
    </Shell>
  );
}

/* 3 — Container Images: a container with no seal and a gap in its face. */
export function RiskContainer(): React.ReactElement {
  const id = 'fr2';
  const p = PALS[2] as Pal;
  const b = box(80, 70, 42, 23, 40);
  return (
    <Shell
      id={id}
      label="Container images, drawn as an unsealed container with a gap in its face."
      pal={p}
    >
      <Solid b={b} pal={p} id={id} />
      <g stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.6">
        {[0.28, 0.52, 0.76].map((t) => (
          <path
            key={`l${t}`}
            d={`M${38 + t * 42} ${70 + t * 23} L${38 + t * 42} ${110 + t * 23}`}
          />
        ))}
        {[0.28, 0.52, 0.76].map((t) => (
          <path
            key={`r${t}`}
            d={`M${122 - t * 42} ${70 + t * 23} L${122 - t * 42} ${110 + t * 23}`}
          />
        ))}
      </g>
      {/* The gap — where an unverified base image lets things through. */}
      <path d="M50 82 L70 93 L70 113 L50 102 Z" fill="#0b0820" />
      <path d="M50 82 L70 93 L70 113 L50 102 Z" fill="none" stroke={RISK} strokeWidth="2" />
    </Shell>
  );
}

/* 4 — AI-Generated Code: a code surface producing unvetted pieces. */
export function RiskAICode(): React.ReactElement {
  const id = 'fr3';
  const p = PALS[3] as Pal;
  const b = box(80, 92, 44, 24, 10);
  return (
    <Shell
      id={id}
      label="AI-generated code, drawn as a code surface producing unvetted components."
      pal={p}
    >
      <Solid b={b} pal={p} id={id} />
      <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round">
        <path d="M56 92 L76 81" />
        <path d="M66 100 L92 86" />
        <path d="M62 108 L80 98" />
      </g>
      <g stroke={p.edge} strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="2 4">
        <path d="M70 82 L54 54" />
        <path d="M92 78 L104 46" />
      </g>
      {[
        { cx: 54, cy: 48, s: 0.5 },
        { cx: 104, cy: 40, s: 0.42 },
      ].map((c, i) => (
        <g key={i}>
          <circle
            cx={c.cx}
            cy={c.cy + 6}
            r={20 * c.s}
            fill={p.topLo}
            fillOpacity="0.3"
            filter={`url(#${id}B)`}
          />
          <Solid b={box(c.cx, c.cy, 18 * c.s, 10 * c.s, 12 * c.s)} pal={p} id={id} />
        </g>
      ))}
    </Shell>
  );
}

/* 5 — Build & Delivery Pipeline: a belt moving artifacts onward. */
export function RiskPipeline(): React.ReactElement {
  const id = 'fr4';
  const p = PALS[4] as Pal;
  return (
    <Shell
      id={id}
      label="The build and delivery pipeline, drawn as a conveyor moving artifacts onward."
      pal={p}
    >
      {/* Belt. */}
      <Solid b={box(80, 100, 50, 26, 9)} pal={p} id={id} />
      {/* Rollers under the belt. */}
      <g fill={p.left}>
        {[46, 80, 114].map((x) => (
          <circle key={x} cx={x} cy={124} r="5" />
        ))}
      </g>
      {/* Artifacts riding it. */}
      {[
        { cx: 54, cy: 82, s: 0.55 },
        { cx: 96, cy: 74, s: 0.55 },
      ].map((c, i) => (
        <Solid key={i} b={box(c.cx, c.cy, 20 * c.s, 11 * c.s, 13 * c.s)} pal={p} id={id} />
      ))}
      {/* Gantry above, placing them. */}
      <g stroke={p.edge} strokeOpacity="0.7" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M112 36 L112 54" />
        <path d="M112 36 L86 36" />
        <path d="M86 36 L86 48" />
      </g>
      <rect x="80" y="48" width="12" height="8" rx="2" fill={p.top} />
    </Shell>
  );
}

/* 6 — Financial Applications: the institution everything arrives at. */
export function RiskInstitution(): React.ReactElement {
  const id = 'fr5';
  const p = PALS[5] as Pal;
  return (
    <Shell
      id={id}
      label="Financial applications, drawn as the institution every upstream stage arrives at."
      pal={p}
    >
      <Solid b={box(80, 104, 48, 25, 12)} pal={p} id={id} edge={false} />
      {/* Columns. */}
      <g fill={p.top} fillOpacity="0.92">
        {[56, 70, 84, 98].map((x) => (
          <rect key={x} x={x} y="58" width="9" height="34" rx="1.5" />
        ))}
      </g>
      <rect x="48" y="90" width="65" height="6" rx="2" fill={p.edge} fillOpacity="0.85" />
      <rect x="50" y="52" width="61" height="6" rx="2" fill={p.edge} fillOpacity="0.85" />
      {/* Pediment. */}
      <path d="M80 26 L118 50 L42 50 Z" fill={`url(#${id}T)`} />
      <path
        d="M80 26 L118 50 L42 50 Z"
        fill="none"
        stroke={p.edge}
        strokeOpacity="0.7"
        strokeWidth="1.4"
      />
    </Shell>
  );
}

export const RISK_ART = [
  RiskOpenSource,
  RiskLibraries,
  RiskContainer,
  RiskAICode,
  RiskPipeline,
  RiskInstitution,
] as const;
