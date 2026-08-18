import type React from 'react';

/*
 * FinanceVerifiedArt — the two verified artifacts, at full scale.
 *
 * These are deliberately the SAME two objects the risk chain shows untrusted,
 * answered: the container that had a breach cut into its face is closed,
 * sealed and struck; the modules that were wired to loose unreviewed nodes are
 * connected, checked, and lit. A reader who scrolled past the dark band should
 * recognise the objects and see what changed about them — that recognition is
 * the argument, and it is why these are not new illustrations.
 *
 * Verification is shown happening rather than asserted: a bright plane sweeps
 * up through each artifact, clipped to its own silhouette, and the seal holds
 * its struck state. Motion is CSS keyframes (`cs-fin-verify*` in globals.css),
 * and `prefers-reduced-motion` collapses to the resolved frame — sealed, lit,
 * nothing moving — because "verified" is the state the still must hold.
 *
 * Same isometric projection, light direction and shadow treatment as
 * FinanceComponentArt and FinanceRiskArt. No baked text.
 */

type Face = { top: string; left: string; right: string };

function box(cx: number, cy: number, hw: number, hd: number, ht: number): Face {
  return {
    top: `M${cx} ${cy - hd} L${cx + hw} ${cy} L${cx} ${cy + hd} L${cx - hw} ${cy} Z`,
    left: `M${cx - hw} ${cy} L${cx} ${cy + hd} L${cx} ${cy + hd + ht} L${cx - hw} ${cy + ht} Z`,
    right: `M${cx + hw} ${cy} L${cx} ${cy + hd} L${cx} ${cy + hd + ht} L${cx + hw} ${cy + ht} Z`,
  };
}

const VERIFIED = '#5FE3FF';

function Frame({
  id,
  label,
  from,
  to,
  children,
  sweep,
}: {
  id: string;
  label: string;
  from: string;
  to: string;
  children: React.ReactNode;
  /** Silhouette the verification sweep is clipped to. */
  sweep: string;
}): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label={label}
      className="cs-fin-verified pointer-events-none select-none"
      viewBox="0 0 260 230"
      width="100%"
      height="100%"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}T`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={VERIFIED} stopOpacity="0.34" />
          <stop offset="100%" stopColor={VERIFIED} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}B`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id={`${id}Clip`}>
          <path d={sweep} />
        </clipPath>
      </defs>

      {/* Verified aura — the light this section trades the dark band for. */}
      <ellipse cx="130" cy="150" rx="126" ry="96" fill={`url(#${id}Halo)`} />
      <ellipse
        cx="130"
        cy="206"
        rx="72"
        ry="14"
        fill="rgba(60,50,120,0.22)"
        filter={`url(#${id}B)`}
      />

      {children}

      {/* Verification sweep, clipped to the artifact itself. */}
      <g clipPath={`url(#${id}Clip)`}>
        <rect
          className="cs-fin-verify-sweep"
          x="0"
          y="196"
          width="260"
          height="26"
          fill={VERIFIED}
          fillOpacity="0.55"
          filter={`url(#${id}B)`}
        />
      </g>

      {/* Verification ring — the artifact is under continuous check. */}
      <ellipse
        className="cs-fin-verify-ring"
        cx="130"
        cy="200"
        rx="92"
        ry="20"
        fill="none"
        stroke={VERIFIED}
        strokeWidth="1.4"
        strokeOpacity="0.5"
        strokeDasharray="3 10"
      />
    </svg>
  );
}

/** Struck verification seal — the page's trust mark, at artifact scale. */
function Seal({ x, y, s = 1 }: { x: number; y: number; s?: number }): React.ReactElement {
  return (
    <g className="cs-fin-verify-seal" style={{ transformOrigin: `${x}px ${y}px` }}>
      <path
        d={`M${x} ${y - 26 * s} L${x + 22 * s} ${y - 15 * s} L${x + 22 * s} ${y + 8 * s} Q${x + 22 * s} ${y + 26 * s} ${x} ${y + 34 * s} Q${x - 22 * s} ${y + 26 * s} ${x - 22 * s} ${y + 8 * s} L${x - 22 * s} ${y - 15 * s} Z`}
        fill="#0c0a24"
        fillOpacity="0.62"
        stroke={VERIFIED}
        strokeWidth={2.6 * s}
        strokeLinejoin="round"
      />
      <path
        d={`M${x - 10 * s} ${y + 4 * s} l${7 * s} ${7.5 * s} l${14 * s} ${-16 * s}`}
        stroke="#ffffff"
        strokeWidth={3.4 * s}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

/* Verified Container Images — the breached container of the risk chain, closed
   and struck. */
export function ArtVerifiedContainer(): React.ReactElement {
  const id = 'fv0';
  const b = box(130, 104, 68, 37, 60);
  return (
    <Frame
      id={id}
      label="A verified container image: the same container shown breached upstream, now closed, sealed and struck with a verification mark."
      from="#A87DFF"
      to="#6B44E0"
      sweep={`${b.top} ${b.left} ${b.right}`}
    >
      <path d={b.left} fill="#3B2585" />
      <path d={b.right} fill="#5735BC" />
      <path d={b.top} fill={`url(#${id}T)`} />

      {/* Corrugation. */}
      <g stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2.4">
        {[0.2, 0.38, 0.56, 0.74, 0.92].map((t) => (
          <path
            key={`l${t}`}
            d={`M${62 + t * 68} ${104 + t * 37} L${62 + t * 68} ${164 + t * 37}`}
          />
        ))}
        {[0.2, 0.38, 0.56, 0.74, 0.92].map((t) => (
          <path
            key={`r${t}`}
            d={`M${198 - t * 68} ${104 + t * 37} L${198 - t * 68} ${164 + t * 37}`}
          />
        ))}
      </g>
      <g fill="#ffffff" fillOpacity="0.22">
        <rect x="56" y="101" width="11" height="11" rx="2.5" />
        <rect x="193" y="101" width="11" height="11" rx="2.5" />
      </g>
      <path d={b.top} fill="none" stroke="#D3BCFF" strokeOpacity="0.7" strokeWidth="1.8" />
      <Seal x={96} y={150} s={1.05} />
    </Frame>
  );
}

/* Verified Libraries & Dependencies — the loose unreviewed nodes of the risk
   chain, now connected and checked. */
export function ArtVerifiedLibraries(): React.ReactElement {
  const id = 'fv1';
  const slabs = [
    { cy: 152, hw: 64, hd: 34, ht: 17 },
    { cy: 122, hw: 57, hd: 31, ht: 16 },
    { cy: 94, hw: 50, hd: 27, ht: 15 },
  ];
  const sweep = slabs
    .map((s) => {
      const b = box(130, s.cy, s.hw, s.hd, s.ht);
      return `${b.top} ${b.left} ${b.right}`;
    })
    .join(' ');
  const nodes = [
    { x: 34, y: 96 },
    { x: 226, y: 92 },
    { x: 30, y: 146 },
    { x: 230, y: 142 },
  ];
  return (
    <Frame
      id={id}
      label="Verified libraries and dependencies: the modules shown wired to unreviewed nodes upstream, now connected, checked and accounted for."
      from="#8189F4"
      to="#4A63D8"
      sweep={sweep}
    >
      {/* Every dependency now resolved and checked — solid links, not loose. */}
      <g stroke={VERIFIED} strokeOpacity="0.65" strokeWidth="1.8">
        <path d="M70 118 L34 96" />
        <path d="M190 114 L226 92" />
        <path d="M68 150 L30 146" />
        <path d="M192 148 L230 142" />
      </g>
      {nodes.map((n) => (
        <g key={`${n.x}-${n.y}`}>
          <circle
            cx={n.x}
            cy={n.y}
            r="10"
            fill="#0c0a24"
            fillOpacity="0.7"
            stroke={VERIFIED}
            strokeWidth="1.6"
          />
          <path
            d={`M${n.x - 4.5} ${n.y} l3.4 3.6 l6.2 -7.4`}
            stroke={VERIFIED}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      ))}

      {slabs.map((s) => {
        const b = box(130, s.cy, s.hw, s.hd, s.ht);
        return (
          <g key={s.cy}>
            <path d={b.left} fill="#2F3892" />
            <path d={b.right} fill="#4050B0" />
            <path d={b.top} fill={`url(#${id}T)`} />
            <path d={b.top} fill="none" stroke="#BCC3FF" strokeOpacity="0.65" strokeWidth="1.6" />
          </g>
        );
      })}
      <Seal x={130} y={90} s={0.95} />
    </Frame>
  );
}
