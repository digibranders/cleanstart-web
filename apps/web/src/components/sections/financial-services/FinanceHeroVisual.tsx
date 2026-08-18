import type React from 'react';

/*
 * Financial-services hero — "Verified Foundation".
 *
 * Pure SVG + CSS visual that states the headline literally: a financial
 * institution resting on a stack of verified software strata over a lit
 * bedrock. Reading bottom-up —
 *
 *   verified bedrock (CleanStart) → hardened strata, each sealed
 *     → the institution the whole stack carries.
 *
 * Inherited risk arrives from above-left and is turned away at the boundary,
 * so "secure from the foundation" is shown, not asserted. Deliberately
 * different in construction from the CISO hero's left→right interception
 * field: this one is vertical and architectural, because the claim is about
 * what the software *stands on*.
 *
 * All motion is CSS keyframes (namespaced `cs-fin-*` in globals.css) — no JS
 * rAF loop, GPU-cheap. `prefers-reduced-motion` collapses to the resolved
 * frame (stack lit, seals set, nothing moving). Decorative and text-free, so
 * it carries no copy that needs to reflow, translate, or be read aloud; the
 * `aria-label` describes it once. Server-rendered, no client runtime.
 */

interface Slab {
  /** Centre-y of the slab's top face in viewBox units. */
  y: number;
  /** Half-width of the top face. Widens downward — a foundation, not a tower. */
  hw: number;
  /** 0 = topmost stratum, 3 = bedrock. Drives fill + seal treatment. */
  depth: number;
}

// Half-depth of every top face and the extrusion height of every front face.
// Shared so the isometric projection stays consistent across the stack.
const HD = 32;
const EXT = 19;

const SLABS: readonly Slab[] = [
  { y: 252, hw: 116, depth: 0 },
  { y: 306, hw: 134, depth: 1 },
  { y: 360, hw: 152, depth: 2 },
  { y: 414, hw: 170, depth: 3 },
];

/** Top face rhombus of a slab. */
function topFace(y: number, hw: number): string {
  return `M300 ${y - HD} L${300 + hw} ${y} L300 ${y + HD} L${300 - hw} ${y} Z`;
}

/** Left + right extruded front faces of a slab, as one path. */
function frontFaces(y: number, hw: number): string {
  return (
    `M${300 - hw} ${y} L300 ${y + HD} L300 ${y + HD + EXT} L${300 - hw} ${y + EXT} Z ` +
    `M300 ${y + HD} L${300 + hw} ${y} L${300 + hw} ${y + EXT} L300 ${y + HD + EXT} Z`
  );
}

// Inherited risk arriving from above-left. Each is turned away at the stack
// boundary rather than landing on it.
const DEFLECTED: readonly { x: number; y: number; delay: number }[] = [
  { x: 128, y: 132, delay: 0 },
  { x: 186, y: 92, delay: 1.6 },
  { x: 96, y: 190, delay: 2.9 },
];

export function FinanceHeroVisual(): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label="A financial institution resting on a stack of verified software layers above a lit CleanStart foundation. Each layer carries a verification seal, a scan sweeps continuously up the stack, and inherited vulnerabilities arriving from outside are turned away at the boundary."
      className="cs-fin-hero pointer-events-none select-none"
      viewBox="0 40 600 470"
      width="100%"
      height="100%"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="finVioletField" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7b3cf0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#471ec0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="finBedrockGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2cc1eb" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#2cc1eb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="finSlabTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b2a7a" />
          <stop offset="100%" stopColor="#241a55" />
        </linearGradient>
        <linearGradient id="finBedrockTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#37d9f5" />
          <stop offset="100%" stopColor="#1763d6" />
        </linearGradient>
        <linearGradient id="finPediment" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9e8ff" />
          <stop offset="100%" stopColor="#8fb4ff" />
        </linearGradient>
        <filter id="finSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="finStrong" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        {/* Clips the travelling scan to the stack's silhouette so the sweep
            reads as passing *through* the layers, not floating over them. */}
        <clipPath id="finStackClip">
          {SLABS.map((s) => (
            <path key={`clip-${s.depth}`} d={`${topFace(s.y, s.hw)} ${frontFaces(s.y, s.hw)}`} />
          ))}
        </clipPath>
      </defs>

      {/* Ambient fields — violet where risk originates, cyan at the foundation. */}
      <circle cx="212" cy="176" r="196" fill="url(#finVioletField)" />
      <ellipse cx="300" cy="440" rx="266" ry="132" fill="url(#finBedrockGlow)" />

      {/* Inherited risk turned away at the boundary. */}
      <g className="cs-fin-deflect-group">
        {DEFLECTED.map((d, i) => (
          <g
            key={`risk-${i}`}
            className="cs-fin-deflect"
            style={{ animationDelay: `${d.delay}s`, transformOrigin: `${d.x}px ${d.y}px` }}
          >
            <circle cx={d.x} cy={d.y} r="7" fill="#ff5a5a" fillOpacity="0.16" />
            <path
              d={`M${d.x} ${d.y - 5} L${d.x + 5} ${d.y + 4} L${d.x - 5} ${d.y + 4} Z`}
              fill="none"
              stroke="#ff8a8a"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </g>

      {/* The institution the stack carries — pediment, columns, plinth. */}
      <g className="cs-fin-institution">
        <path d="M300 108 L372 154 L228 154 Z" fill="url(#finPediment)" fillOpacity="0.92" />
        <rect x="232" y="158" width="136" height="7" rx="3" fill="#c3d8ff" fillOpacity="0.85" />
        {[248, 276, 304, 332].map((x) => (
          <rect
            key={`col-${x}`}
            x={x}
            y="169"
            width="14"
            height="38"
            rx="2"
            fill="#b9d1ff"
            fillOpacity="0.72"
          />
        ))}
        <rect x="224" y="209" width="152" height="9" rx="4" fill="#d9e8ff" fillOpacity="0.9" />
      </g>

      {/* The verified stack. Bedrock (depth 3) is lit; the strata above it are
          hardened but quiet, so the eye lands on what everything rests on. */}
      {SLABS.map((s) => {
        const isBedrock = s.depth === 3;
        return (
          <g key={`slab-${s.depth}`}>
            <path
              d={frontFaces(s.y, s.hw)}
              fill={isBedrock ? '#0f4f8f' : '#1b1442'}
              fillOpacity={isBedrock ? 0.95 : 0.9}
            />
            <path
              d={topFace(s.y, s.hw)}
              fill={isBedrock ? 'url(#finBedrockTop)' : 'url(#finSlabTop)'}
              stroke={isBedrock ? '#9fefff' : '#6f5bd0'}
              strokeWidth={isBedrock ? 1.6 : 1.1}
              strokeOpacity={isBedrock ? 0.9 : 0.55}
            />
            {/* Verification seal, docked at the slab's right vertex. */}
            <g
              className="cs-fin-seal"
              style={{
                animationDelay: `${s.depth * 0.35}s`,
                transformOrigin: `${300 + s.hw + 26}px ${s.y + 2}px`,
              }}
            >
              <circle
                cx={300 + s.hw + 26}
                cy={s.y + 2}
                r="11"
                fill="#0e1430"
                fillOpacity="0.75"
                stroke="#2cc1eb"
                strokeWidth="1.3"
                strokeOpacity="0.8"
              />
              <path
                d={`M${300 + s.hw + 21} ${s.y + 2} l3.6 3.8 l6.6 -7.6`}
                stroke="#9fefff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </g>
        );
      })}

      {/* Continuous verification — a bright plane sweeping up through the
          stack, clipped to the stack silhouette. */}
      <g clipPath="url(#finStackClip)">
        <path
          className="cs-fin-scan"
          d={topFace(452, 182)}
          fill="#eafdff"
          fillOpacity="0.5"
          filter="url(#finStrong)"
        />
      </g>

      {/* Bedrock underglow — the foundation reading as the source of trust. */}
      <ellipse
        className="cs-fin-bedrock-glow"
        cx="300"
        cy="452"
        rx="186"
        ry="26"
        fill="#2cc1eb"
        fillOpacity="0.35"
        filter="url(#finStrong)"
      />
    </svg>
  );
}
