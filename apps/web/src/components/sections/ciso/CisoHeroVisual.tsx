import type React from "react";

/*
 * CISO hero — "Interception Field".
 *
 * Pure SVG + CSS visual that dramatises the headline ("AI scales code
 * velocity, security can't keep up") and resolves it in CleanStart's favour:
 *
 *   chaotic inherited dependency nodes (left, dim / red)
 *     → a glowing verification membrane (centre)
 *       → verified, calm cyan lattice docked around a secure core (right).
 *
 * All motion is CSS keyframes (namespaced `cs-civ-*` in globals.css) — no JS
 * rAF loop, GPU-cheap. `prefers-reduced-motion` collapses it to the final
 * resolved frame (lit membrane + clean lattice, no movement). The component is
 * decorative: `aria-hidden`, no semantic content, server-rendered (no client
 * runtime). Coordinate space is the SVG viewBox, so it never drifts the way the
 * old hand-masked photo did — it scales with its container at every viewport.
 */

type ChaosNode = { x: number; y: number; r: number; red?: boolean };
type Packet = { ox: number; oy: number; dx: number; dy: number; delay: number };

// Chaotic inherited dependencies — upper-left cluster, dim with a few red CVEs.
const CHAOS: readonly ChaosNode[] = [
  { x: 70, y: 150, r: 5, red: true },
  { x: 122, y: 208, r: 4 },
  { x: 58, y: 262, r: 4 },
  { x: 152, y: 150, r: 5 },
  { x: 204, y: 250, r: 4, red: true },
  { x: 96, y: 332, r: 5 },
  { x: 170, y: 360, r: 4 },
  { x: 240, y: 182, r: 4 },
  { x: 132, y: 424, r: 5, red: true },
];

// Verified lattice — orderly cyan dots docked to the right of the secure core.
const LATTICE: readonly { x: number; y: number }[] = [
  { x: 506, y: 232 },
  { x: 552, y: 232 },
  { x: 506, y: 300 },
  { x: 552, y: 300 },
  { x: 506, y: 368 },
  { x: 552, y: 368 },
];

// Traveling packets: each launches from a chaos point (ox,oy) and docks at a
// lattice slot (dx,dy), crossing the membrane mid-flight where it hardens.
const PACKETS: readonly Packet[] = [
  { ox: 90, oy: 170, dx: 506, dy: 232, delay: 0 },
  { ox: 60, oy: 300, dx: 552, dy: 300, delay: 0.95 },
  { ox: 120, oy: 420, dx: 506, dy: 368, delay: 1.9 },
  { ox: 180, oy: 150, dx: 552, dy: 232, delay: 0.5 },
  { ox: 150, oy: 360, dx: 506, dy: 300, delay: 1.45 },
  { ox: 222, oy: 230, dx: 552, dy: 368, delay: 2.4 },
];

const MEMBRANE_X = 300;

export function CisoHeroVisual(): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label="CleanStart hardening flow: inherited software dependencies, some carrying vulnerabilities, pass through CleanStart verification and emerge hardened and compliance-ready."
      className="cs-civ pointer-events-none select-none"
      viewBox="0 46 600 478"
      width="100%"
      height="100%"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="civCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22e0ff" stopOpacity="0.55" />
          <stop offset="42%" stopColor="#2cc1eb" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="civVioletGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#471ec0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#471ec0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="civMembrane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2cc1eb" stopOpacity="0" />
          <stop offset="16%" stopColor="#2cc1eb" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#d6fbff" stopOpacity="1" />
          <stop offset="84%" stopColor="#2cc1eb" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="civBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2cc1eb" stopOpacity="0" />
          <stop offset="55%" stopColor="#2cc1eb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a8efff" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="civCoreFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2cc1eb" />
          <stop offset="100%" stopColor="#1763d6" />
        </linearGradient>
        <filter id="civSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="civStrong" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Ambient glows — violet chaos field (left), cyan secure field (right). */}
      <circle cx="150" cy="288" r="205" fill="url(#civVioletGlow)" />
      <circle cx="438" cy="300" r="180" fill="url(#civCoreGlow)" />

      {/* Convergence beams — chaos origin → lattice dock, crossing the membrane. */}
      <g className="cs-civ-beams" stroke="url(#civBeam)" strokeWidth="1.25">
        {PACKETS.map((p, i) => (
          <line
            key={`beam-${i}`}
            x1={p.ox}
            y1={p.oy}
            x2={p.dx}
            y2={p.dy}
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}
      </g>

      {/* Chaotic inherited dependencies — dim, a few flickering red. */}
      <g filter="url(#civSoft)">
        {CHAOS.map((n, i) => (
          <circle
            key={`chaos-${i}`}
            className="cs-civ-chaos"
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.red ? "#ff6c6c" : "#8b7fd6"}
            opacity={n.red ? 0.95 : 0.6}
            style={{ animationDelay: `${(i % 5) * 0.6}s` }}
          />
        ))}
      </g>

      {/* Verification membrane — vertical glowing gate + traveling scan sweep.
          A wide, low-opacity halo gives the gate presence; the crisp core line
          reads as the actual boundary. */}
      <rect
        x={MEMBRANE_X - 16}
        y="92"
        width="32"
        height="432"
        rx="16"
        fill="url(#civMembrane)"
        opacity="0.28"
        filter="url(#civStrong)"
      />
      <rect
        x={MEMBRANE_X - 2}
        y="96"
        width="4"
        height="424"
        rx="2"
        fill="url(#civMembrane)"
        filter="url(#civSoft)"
      />
      <rect
        className="cs-civ-sweep"
        x={MEMBRANE_X - 7}
        y="96"
        width="14"
        height="52"
        rx="7"
        fill="#eafdff"
        opacity="0.9"
        filter="url(#civStrong)"
      />

      {/* Verified lattice — calm cyan dots, gentle staggered pulse. */}
      <g>
        {LATTICE.map((d, i) => (
          <g key={`lat-${i}`}>
            <line
              x1="430"
              y1="300"
              x2={d.x}
              y2={d.y}
              stroke="#2cc1eb"
              strokeWidth="1"
              strokeOpacity="0.28"
            />
            <circle
              className="cs-civ-pulse"
              cx={d.x}
              cy={d.y}
              r="5"
              fill="#7fe6ff"
              style={{ animationDelay: `${i * 0.4}s`, transformOrigin: `${d.x}px ${d.y}px` }}
            />
          </g>
        ))}
      </g>

      {/* Traveling packets — launch from chaos, harden (red→cyan) at the gate,
          dock into the lattice. One shared keyframe; per-packet launch offset
          is resolved from --civ-fx / --civ-fy on each element. */}
      {PACKETS.map((p, i) => (
        <circle
          key={`packet-${i}`}
          className="cs-civ-packet"
          cx={p.dx}
          cy={p.dy}
          r="4.5"
          fill="#a8efff"
          filter="url(#civSoft)"
          style={
            {
              "--civ-fx": `${p.ox - p.dx}px`,
              "--civ-fy": `${p.oy - p.dy}px`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Radar scope — dashed ring slowly sweeping around the secure core,
          reinforcing the "active scanning" read. */}
      <circle
        className="cs-civ-scope"
        cx="430"
        cy="300"
        r="86"
        fill="none"
        stroke="#2cc1eb"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeDasharray="2 9"
        style={{ transformOrigin: "430px 300px" }}
      />

      {/* Secure core — the CleanStart hardening anchor: a shield with a check,
          slow breathing glow. */}
      <g className="cs-civ-core">
        <rect
          x="384"
          y="254"
          width="92"
          height="92"
          rx="22"
          fill="#0e1430"
          fillOpacity="0.7"
          stroke="url(#civCoreFace)"
          strokeWidth="1.5"
          filter="url(#civSoft)"
        />
        <path
          d="M430 268 L458 279 L458 305 Q458 328 430 340 Q402 328 402 305 L402 279 Z"
          fill="#2cc1eb"
          fillOpacity="0.16"
          stroke="#9fefff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M417 303 l9 9 l18 -20"
          stroke="#eafdff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Vulnerable-package anchor — a recognisable dependency box with a red
          alert badge, so the left zone reads as "risky inherited package", not
          just dots. Pairs against the verified shield on the right. */}
      <g transform="translate(150 248)">
        <rect
          x="-15"
          y="-15"
          width="30"
          height="30"
          rx="6"
          fill="rgba(255,90,90,0.12)"
          stroke="#ff8a8a"
          strokeWidth="1.5"
        />
        <path d="M-15 -3 H15 M0 -15 V-3" stroke="#ff8a8a" strokeWidth="1.25" strokeOpacity="0.7" />
        <circle cx="14" cy="-14" r="7" fill="#ff5a5a" />
        <path d="M14 -17.5 V-12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="14" cy="-10" r="1" fill="#fff" />
      </g>

      {/* Stage captions — name the three steps so the flow is legible at a
          glance. Anchored above each zone (risk / gate / hardened), with
          chevrons implying left → right process. */}
      <g className="cs-civ-cap" textAnchor="middle">
        <text x="150" y="62" fill="#ffb0b0">INHERITED</text>
        <text x="150" y="79" fill="#ffb0b0">RISK</text>

        <text x="300" y="62" fill="#8fe9ff">CLEANSTART</text>
        <text x="300" y="79" fill="#8fe9ff">VERIFICATION</text>

        <text x="480" y="62" fill="#b9f3ff">HARDENED &amp;</text>
        <text x="480" y="79" fill="#b9f3ff">COMPLIANT</text>
      </g>
      <g stroke="#7fd9f0" strokeWidth="1.5" strokeOpacity="0.55" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M216 67 l5 5 l-5 5" />
        <path d="M396 67 l5 5 l-5 5" />
      </g>
    </svg>
  );
}
