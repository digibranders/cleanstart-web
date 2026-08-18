import type React from 'react';

/*
 * FinanceComponentArt — the four software components of a financial
 * application, each drawn as the thing it actually is.
 *
 * The proposal's own reference imagery depicts each component as a
 * recognisable object rather than as an abstraction, and that instinct is
 * right: a reader should know what they are looking at before they read the
 * label under it. So — a sealed shipping container, a set of interlocking
 * modules, a dependency tree that branches into more than it started with, and
 * a code surface emitting new pieces of itself.
 *
 * Rendered in CleanStart's violet→cyan ramp as authored isometric SVG: no
 * podiums, no stock-render gloss, no baked lettering. All four share one
 * projection (half-width : half-depth ≈ 1.85 : 1), one light direction (upper
 * left), and one shadow treatment, so they read as a set rather than as four
 * borrowed illustrations.
 *
 * Every id is namespaced per object because these render as siblings.
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

interface Palette {
  top: string;
  topLo: string;
  left: string;
  right: string;
  edge: string;
}

const PALETTES: readonly [Palette, Palette, Palette, Palette] = [
  { top: '#A87DFF', topLo: '#7C4FF0', left: '#432A93', right: '#5B39C2', edge: '#C9AEFF' },
  { top: '#8189F4', topLo: '#5C6BE8', left: '#333F9C', right: '#4354BB', edge: '#B3BAFF' },
  { top: '#5AA6E9', topLo: '#2F7FD4', left: '#20558E', right: '#2A6DB6', edge: '#A6D2F7' },
  { top: '#4CD3EF', topLo: '#17B3DE', left: '#12657F', right: '#1785A6', edge: '#A8ECFA' },
];

function Shell({
  id,
  label,
  children,
}: { id: string; label: string; children: React.ReactNode }): React.ReactElement {
  const p = PALETTES[Number(id.slice(-1)) as 0 | 1 | 2 | 3] ?? PALETTES[0];
  return (
    <svg
      role="img"
      aria-label={label}
      className="cs-fin-obj pointer-events-none select-none"
      viewBox="0 0 220 200"
      width="100%"
      height="100%"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}Top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.top} />
          <stop offset="100%" stopColor={p.topLo} />
        </linearGradient>
        <filter id={`${id}Blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

/** Shared ground shadow — one treatment across all four objects. */
function Ground({ id, cy, rx = 62 }: { id: string; cy: number; rx?: number }): React.ReactElement {
  return (
    <ellipse
      cx="110"
      cy={cy}
      rx={rx}
      ry={rx * 0.2}
      fill="rgba(70,60,130,0.26)"
      filter={`url(#${id}Blur)`}
    />
  );
}

/* ── 1. Container Images ─────────────────────────────────────────────────────
   A sealed shipping container: corrugated faces, corner castings, and a
   verification seal struck on the front. */
export function ArtContainerImages(): React.ReactElement {
  const id = 'finObj0';
  const p = PALETTES[0];
  const b = box(110, 83, 58, 32, 55);
  return (
    <Shell id={id} label="A sealed and verified container image, drawn as a shipping container.">
      <Ground id={id} cy={176} rx={58} />
      <path d={b.left} fill={p.left} />
      <path d={b.right} fill={p.right} />
      <path d={b.top} fill={`url(#${id}Top)`} />

      {/* Corrugation — the ribs that make it read as a container, not a cube. */}
      <g stroke="#ffffff" strokeOpacity="0.16" strokeWidth="2">
        {[0.22, 0.42, 0.62, 0.82].map((t) => (
          <path
            key={`l${t}`}
            d={`M${52 + t * 58} ${83 + t * 32} L${52 + t * 58} ${138 + t * 32}`}
          />
        ))}
        {[0.22, 0.42, 0.62, 0.82].map((t) => (
          <path
            key={`r${t}`}
            d={`M${168 - t * 58} ${83 + t * 32} L${168 - t * 58} ${138 + t * 32}`}
          />
        ))}
      </g>
      {/* Corner castings. */}
      <g fill="#ffffff" fillOpacity="0.22">
        <rect x="48" y="81" width="9" height="9" rx="2" />
        <rect x="163" y="81" width="9" height="9" rx="2" />
      </g>

      {/* Verification seal, struck on the left face. */}
      <path
        d="M80 113 L96 120 L96 138 Q96 150 80 156 Q64 150 64 138 L64 120 Z"
        fill="#150f33"
        fillOpacity="0.5"
        stroke={p.edge}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M72 135 l5.5 5.6 l10 -11.4"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d={b.top} fill="none" stroke={p.edge} strokeOpacity="0.65" strokeWidth="1.5" />
    </Shell>
  );
}

/* ── 2. Open Source Libraries ────────────────────────────────────────────────
   Interlocking modules — a set of parts that snap together and get reused,
   with two spares waiting off to the side. */
export function ArtOpenSourceLibraries(): React.ReactElement {
  const id = 'finObj1';
  const p = PALETTES[1];
  const slabs = [
    { cy: 126, hw: 56, hd: 30, ht: 15 },
    { cy: 100, hw: 50, hd: 27, ht: 14 },
    { cy: 76, hw: 44, hd: 24, ht: 13 },
  ];
  return (
    <Shell
      id={id}
      label="Open source libraries, drawn as interlocking reusable modules with spare parts alongside."
    >
      <Ground id={id} cy={176} rx={56} />
      {slabs.map((s, i) => {
        const b = box(110, s.cy, s.hw, s.hd, s.ht);
        return (
          <g key={i}>
            <path d={b.left} fill={p.left} />
            <path d={b.right} fill={p.right} />
            <path d={b.top} fill={`url(#${id}Top)`} />
            <path d={b.top} fill="none" stroke={p.edge} strokeOpacity="0.55" strokeWidth="1.3" />
            {/* Notch + tab: the join that makes them modules, not slabs. */}
            <path
              d={`M${110 - 11} ${s.cy} L110 ${s.cy + 6} L${110 + 11} ${s.cy} L110 ${s.cy - 6} Z`}
              fill="#ffffff"
              fillOpacity="0.24"
            />
          </g>
        );
      })}
      {/* Spare modules — reuse, waiting to be pulled in. */}
      {[
        { cx: 40, cy: 116, s: 0.5 },
        { cx: 182, cy: 96, s: 0.42 },
      ].map((sp, i) => {
        const b = box(sp.cx, sp.cy, 20 * sp.s * 2, 11 * sp.s * 2, 12 * sp.s * 2);
        return (
          <g key={`sp${i}`} opacity="0.85">
            <path d={b.left} fill={p.left} />
            <path d={b.right} fill={p.right} />
            <path d={b.top} fill={`url(#${id}Top)`} />
          </g>
        );
      })}
    </Shell>
  );
}

/* ── 3. Software Dependencies ────────────────────────────────────────────────
   A dependency tree: one thing you added at the top, branching into more than
   you added — direct, then transitive, then the ecosystem underneath. */
export function ArtSoftwareDependencies(): React.ReactElement {
  const id = 'finObj2';
  const p = PALETTES[2];
  const root = { cx: 110, cy: 44, hw: 26, hd: 14, ht: 15 };
  const mids = [
    { cx: 66, cy: 100, hw: 20, hd: 11, ht: 12 },
    { cx: 154, cy: 100, hw: 20, hd: 11, ht: 12 },
  ];
  const leaves = [
    { cx: 36, cy: 147, hw: 14, hd: 8, ht: 9 },
    { cx: 84, cy: 153, hw: 14, hd: 8, ht: 9 },
    { cx: 132, cy: 153, hw: 14, hd: 8, ht: 9 },
    { cx: 182, cy: 147, hw: 14, hd: 8, ht: 9 },
  ];
  const draw = (n: { cx: number; cy: number; hw: number; hd: number; ht: number }, k: string) => {
    const b = box(n.cx, n.cy, n.hw, n.hd, n.ht);
    return (
      <g key={k}>
        <path d={b.left} fill={p.left} />
        <path d={b.right} fill={p.right} />
        <path d={b.top} fill={`url(#${id}Top)`} />
        <path d={b.top} fill="none" stroke={p.edge} strokeOpacity="0.6" strokeWidth="1.2" />
      </g>
    );
  };
  return (
    <Shell
      id={id}
      label="Software dependencies, drawn as a tree in which one added component branches into many that nobody chose."
    >
      <Ground id={id} cy={176} rx={70} />
      {/* Edges first, so every branch runs under its nodes. */}
      <g stroke={p.topLo} strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round">
        <path d="M110 74 L66 92" />
        <path d="M110 74 L154 92" />
        <path d="M66 123 L36 139" />
        <path d="M66 123 L84 145" />
        <path d="M154 123 L132 145" />
        <path d="M154 123 L182 139" />
        {/* Transitive cross-links — the part nobody reviewed. */}
        <path d="M84 161 L132 161" strokeDasharray="3 5" strokeOpacity="0.4" />
        <path d="M36 155 L84 161" strokeDasharray="3 5" strokeOpacity="0.4" />
      </g>
      {leaves.map((n, i) => draw(n, `lf${i}`))}
      {mids.map((n, i) => draw(n, `md${i}`))}
      {draw(root, 'root')}
    </Shell>
  );
}

/* ── 4. AI-Generated Code ────────────────────────────────────────────────────
   A code surface producing new components of its own — the newest inbound
   source, still emitting. */
export function ArtAIGeneratedCode(): React.ReactElement {
  const id = 'finObj3';
  const p = PALETTES[3];
  const b = box(110, 124, 60, 33, 13);
  return (
    <Shell
      id={id}
      label="AI-generated code, drawn as a code surface emitting new software components."
    >
      <Ground id={id} cy={176} rx={58} />
      <path d={b.left} fill={p.left} />
      <path d={b.right} fill={p.right} />
      <path d={b.top} fill={`url(#${id}Top)`} />
      <path d={b.top} fill="none" stroke={p.edge} strokeOpacity="0.6" strokeWidth="1.4" />

      {/* Code lines, laid onto the surface in its own projection. */}
      <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round">
        <path d="M80 122 L108 106" />
        <path d="M94 132 L130 112" />
        <path d="M88 142 L114 128" />
        <path d="M106 148 L142 128" />
      </g>

      {/* Newly generated components, rising off the surface. */}
      {[
        { cx: 68, cy: 66, s: 0.5, o: 1 },
        { cx: 122, cy: 44, s: 0.4, o: 0.9 },
        { cx: 160, cy: 78, s: 0.46, o: 0.95 },
      ].map((n, i) => {
        const nb = box(n.cx, n.cy, 30 * n.s, 16 * n.s, 18 * n.s);
        return (
          <g key={`gen${i}`} opacity={n.o}>
            <circle
              cx={n.cx}
              cy={n.cy + 8}
              r={26 * n.s}
              fill={p.topLo}
              fillOpacity="0.28"
              filter={`url(#${id}Blur)`}
            />
            <path d={nb.left} fill={p.left} />
            <path d={nb.right} fill={p.right} />
            <path d={nb.top} fill={`url(#${id}Top)`} />
            <path d={nb.top} fill="none" stroke={p.edge} strokeOpacity="0.8" strokeWidth="1.1" />
          </g>
        );
      })}

      {/* Emission traces from the surface to each new piece. */}
      <g stroke={p.edge} strokeWidth="1.3" strokeOpacity="0.5" strokeDasharray="2 5">
        <path d="M92 114 L68 78" />
        <path d="M110 106 L122 58" />
        <path d="M132 114 L158 90" />
      </g>
    </Shell>
  );
}

export const COMPONENT_ART = [
  ArtContainerImages,
  ArtOpenSourceLibraries,
  ArtSoftwareDependencies,
  ArtAIGeneratedCode,
] as const;

export const COMPONENT_ACCENT: readonly [string, string, string, string] = [
  '#7C4FF0',
  '#5C6BE8',
  '#2F7FD4',
  '#17B3DE',
];
