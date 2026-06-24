/**
 * Clean Libraries hero scene — built entirely in SVG/CSS (no raster).
 *
 * Concept (the actual point of the page): the secure container is a FILTER.
 * Clean dependencies (green) pass through the boundary and live inside next to
 * the code; vulnerable dependencies (amber/red) are STOPPED at the edge — each
 * marked with a red ⊘ "blocked" badge — and never get in. A faint membrane arc
 * on the entry side reads as the gate.
 *
 * Fidelity techniques (to escape the flat "vector" look):
 *   - cube faces are gradient-lit (bright top ridge → shaded sides) with an
 *     emissive edge, each sitting on a blurred colored bloom;
 *   - a blurred, dimmed back layer of distant cubes gives atmospheric depth;
 *   - the elliptical container uses stacked glows (wide outer bloom + bright
 *     thin rim) over a vignetted dark interior, with a double-framed, tilted,
 *     top-glossed code card.
 *
 * Motion is paint/transform-only and reuses the repo system: `cs-flow-dash`
 * drifts the dotted streams (green flow inward; amber halt at the gate),
 * `cs-libhero-breathe` pulses the glows, and the parent's `cs-libhero-float`
 * drifts the whole scene. All disabled under `prefers-reduced-motion` (see
 * globals.css), leaving a clean static scene.
 */

type CubeTone = "green" | "amber";

interface CubeSpec {
  x: number;
  y: number;
  scale: number;
  tone: CubeTone;
}

interface Pt {
  x: number;
  y: number;
}

interface CodeLine {
  indent: number;
  width: number;
  color: string;
}

/** Container ellipse — the secure "clean zone". */
const C = { cx: 590, cy: 296, rx: 206, ry: 196 } as const;

/** Boundary entry points where clean packages cross in, and the interior
 *  targets the rails continue to inside the container (clean deps delivered). */
const ENTRY_TOP: Pt = { x: 392, y: 232 };
const ENTRY_BOT: Pt = { x: 398, y: 344 };
const INSIDE_TOP: Pt = { x: 478, y: 254 };
const INSIDE_BOT: Pt = { x: 486, y: 326 };

/** Clean packages — intermixed with the amber ones across the whole field;
 *  each routes through the nearer gate (top half → top gate, bottom half →
 *  bottom gate) and its rail continues inside. */
const GREEN_IN: readonly (CubeSpec & { entry: Pt; inside: Pt })[] = [
  { x: 70, y: 122, scale: 0.95, tone: "green", entry: ENTRY_TOP, inside: INSIDE_TOP },
  { x: 244, y: 138, scale: 0.85, tone: "green", entry: ENTRY_TOP, inside: INSIDE_TOP },
  { x: 132, y: 276, scale: 1.12, tone: "green", entry: ENTRY_TOP, inside: INSIDE_TOP },
  { x: 96, y: 342, scale: 1.05, tone: "green", entry: ENTRY_BOT, inside: INSIDE_BOT },
  { x: 206, y: 320, scale: 0.95, tone: "green", entry: ENTRY_BOT, inside: INSIDE_BOT },
  { x: 162, y: 442, scale: 0.95, tone: "green", entry: ENTRY_BOT, inside: INSIDE_BOT },
  { x: 274, y: 402, scale: 0.8, tone: "green", entry: ENTRY_BOT, inside: INSIDE_BOT },
];

/** Clean packages that already passed — inside the container, by the code. */
const GREEN_INSIDE: readonly CubeSpec[] = [
  { x: 444, y: 250, scale: 0.74, tone: "green" },
  { x: 458, y: 332, scale: 0.78, tone: "green" },
];

/** Vulnerable packages — scattered nearer the gate; each is stopped right on
 *  the container's curve (stop computed in `gateStop`) and gets a ⊘ badge. */
const AMBER_BLOCKED: readonly CubeSpec[] = [
  { x: 150, y: 156, scale: 1.0, tone: "amber" },
  { x: 60, y: 234, scale: 0.9, tone: "amber" },
  { x: 252, y: 224, scale: 0.92, tone: "amber" },
  { x: 96, y: 404, scale: 0.85, tone: "amber" },
];

/** Ambient sparkles scattered through the package field. */
const SPARKS: readonly Pt[] = [
  { x: 60, y: 92 },
  { x: 300, y: 150 },
  { x: 40, y: 360 },
  { x: 322, y: 420 },
  { x: 182, y: 502 },
  { x: 128, y: 120 },
  { x: 272, y: 232 },
];

/** Distant packages — blurred + dimmed for atmospheric depth (all clean). */
const BACK_CUBES: readonly CubeSpec[] = [
  { x: 38, y: 112, scale: 0.6, tone: "green" },
  { x: 206, y: 120, scale: 0.55, tone: "green" },
  { x: 32, y: 304, scale: 0.55, tone: "green" },
  { x: 60, y: 462, scale: 0.6, tone: "green" },
  { x: 250, y: 474, scale: 0.56, tone: "green" },
];

const CODE_LINES: readonly CodeLine[] = [
  { indent: 0, width: 78, color: "#b794ff" },
  { indent: 14, width: 104, color: "#5cc8ff" },
  { indent: 14, width: 58, color: "#5ad6a0" },
  { indent: 28, width: 122, color: "#d6deff" },
  { indent: 28, width: 70, color: "#ffb866" },
  { indent: 14, width: 96, color: "#5ad6a0" },
  { indent: 0, width: 50, color: "#b794ff" },
  { indent: 14, width: 132, color: "#5cc8ff" },
  { indent: 28, width: 80, color: "#d6deff" },
  { indent: 28, width: 110, color: "#5ad6a0" },
  { indent: 14, width: 62, color: "#ffb866" },
  { indent: 0, width: 92, color: "#b794ff" },
  { indent: 14, width: 118, color: "#d6deff" },
];

function Cube({ x, y, scale, tone }: CubeSpec): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={28} rx={30} ry={18} fill={`url(#libGlow-${tone})`} filter="url(#libBloom)" />
      <polygon points="0,0 20,10 0,20 -20,10" fill={`url(#libTop-${tone})`} />
      <polygon points="-20,10 0,20 0,44 -20,34" fill={`url(#libLeft-${tone})`} />
      <polygon points="20,10 0,20 0,44 20,34" fill={`url(#libRight-${tone})`} />
      <polyline points="-20,10 0,0 20,10" fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={0.9} />
      <line x1={0} y1={20} x2={0} y2={44} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={0.7} />
      {/* Specular glint for a glossy material read. */}
      <circle cx={-6} cy={8} r={1.7} fill="#ffffff" opacity={0.85} />
    </g>
  );
}

/** Red ⊘ marking a vulnerable package halted at the boundary. */
function BlockedBadge({ x, y }: Pt): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={0} r={11} fill="#ff5a5a" opacity={0.4} filter="url(#libBloom)" className="cs-lib-twinkle" />
      <circle cx={0} cy={0} r={7.5} fill="#1a0708" stroke="#ff5a5a" strokeWidth={1.8} />
      <line x1={-4.2} y1={-4.2} x2={4.2} y2={4.2} stroke="#ff5a5a" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

function cubeCenter(c: CubeSpec): Pt {
  return { x: c.x, y: c.y + 22 * c.scale };
}

/** Point just outside the container's left curve at height `y` — where a
 *  rejected package is halted (so blocked badges hug the boundary). */
function gateStop(y: number): Pt {
  const t = Math.max(-0.96, Math.min(0.96, (y - C.cy) / C.ry));
  return { x: C.cx - C.rx * Math.sqrt(1 - t * t) - 8, y };
}

export function LibrariesHeroScene(): React.ReactElement {
  const greenStreams = GREEN_IN.map((c) => {
    const s = cubeCenter(c);
    const e = c.entry;
    const i = c.inside;
    const mx = (s.x + e.x) / 2;
    return `M ${s.x} ${s.y} C ${mx} ${s.y}, ${mx} ${e.y}, ${e.x} ${e.y} L ${i.x} ${i.y}`;
  });
  const amberData = AMBER_BLOCKED.map((c) => {
    const s = cubeCenter(c);
    const stop = gateStop(s.y);
    const mx = (s.x + stop.x) / 2;
    return { d: `M ${s.x} ${s.y} C ${mx} ${s.y}, ${mx} ${stop.y}, ${stop.x} ${stop.y}`, stop };
  });

  return (
    <svg
      viewBox="0 0 820 600"
      role="img"
      aria-label="Clean green dependency packages passing into a glowing secure code container while vulnerable amber packages are blocked at the boundary"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full select-none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="libTop-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c6ffdd" />
          <stop offset="100%" stopColor="#62ec9f" />
        </linearGradient>
        <linearGradient id="libLeft-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#39d684" />
          <stop offset="100%" stopColor="#179152" />
        </linearGradient>
        <linearGradient id="libRight-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f9e5c" />
          <stop offset="100%" stopColor="#0b6236" />
        </linearGradient>
        <linearGradient id="libTop-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6b0" />
          <stop offset="100%" stopColor="#ffbf6b" />
        </linearGradient>
        <linearGradient id="libLeft-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9d3d" />
          <stop offset="100%" stopColor="#dd771c" />
        </linearGradient>
        <linearGradient id="libRight-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4621a" />
          <stop offset="100%" stopColor="#8a430e" />
        </linearGradient>

        <radialGradient id="libGlow-green" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#46e08a" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#46e08a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="libGlow-amber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9d3d" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#ff9d3d" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="libBlobGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#62b4ff" stopOpacity={0.6} />
          <stop offset="45%" stopColor="#7a86ff" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#8a56ff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="libBlobBody" cx="44%" cy="38%" r="64%">
          <stop offset="0%" stopColor="#101641" />
          <stop offset="70%" stopColor="#0a0e2e" />
          <stop offset="100%" stopColor="#070a22" />
        </radialGradient>
        <linearGradient id="libBlobRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#74d4ff" />
          <stop offset="50%" stopColor="#8aa6ff" />
          <stop offset="100%" stopColor="#b884ff" />
        </linearGradient>
        <linearGradient id="libCardGloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="libStreamGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#46e08a" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#9affc6" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="libStreamAmber" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff9d3d" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#ff7a5a" stopOpacity={0.9} />
        </linearGradient>

        <filter id="libBloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="libDepthBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <filter id="libRimGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="libWideGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="32" />
        </filter>
      </defs>

      {/* Ambient backdrop bloom behind the whole scene. */}
      <g className="cs-libhero-breathe" style={{ transformOrigin: `${C.cx}px ${C.cy}px`, transformBox: "fill-box" }}>
        <ellipse cx={C.cx} cy={C.cy} rx={C.rx + 56} ry={C.ry + 56} fill="url(#libBlobGlow)" />
      </g>

      {/* Distant package field — blurred + dimmed. */}
      <g filter="url(#libDepthBlur)" opacity={0.5}>
        {BACK_CUBES.map((cube, i) => (
          <Cube key={`b-${i}`} {...cube} />
        ))}
      </g>

      {/* Vulnerable streams — halt at the boundary (rejected). */}
      <g fill="none" strokeLinecap="round" strokeWidth={2.4} strokeDasharray="1 7">
        {amberData.map((a, i) => (
          <path key={`as-${i}`} d={a.d} className="cs-flow-dash" stroke="url(#libStreamAmber)" strokeOpacity={0.8} />
        ))}
      </g>

      {/* The secure code container (elliptical clean zone). */}
      <g>
        <ellipse cx={C.cx} cy={C.cy} rx={C.rx + 8} ry={C.ry + 8} fill="none" stroke="url(#libBlobRim)" strokeWidth={18} strokeOpacity={0.55} filter="url(#libWideGlow)" />
        <ellipse cx={C.cx} cy={C.cy} rx={C.rx} ry={C.ry} fill="url(#libBlobBody)" />
        <ellipse cx={C.cx} cy={C.cy} rx={C.rx} ry={C.ry} fill="none" stroke="url(#libBlobRim)" strokeWidth={6} strokeOpacity={0.55} filter="url(#libRimGlow)" />
        <ellipse cx={C.cx} cy={C.cy} rx={C.rx} ry={C.ry} fill="none" stroke="url(#libBlobRim)" strokeWidth={2.4} />
        {/* Energy glint sweeping around the rim. */}
        <ellipse
          cx={C.cx}
          cy={C.cy}
          rx={C.rx}
          ry={C.ry}
          fill="none"
          stroke="#e2f4ff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="70 1210"
          className="cs-lib-rim"
          filter="url(#libRimGlow)"
        />

        {/* Clean rails — pass through the gate and continue inside the zone. */}
        <g fill="none" strokeLinecap="round" strokeWidth={2.6} strokeDasharray="1 7">
          {greenStreams.map((d, i) => (
            <path key={`gs-${i}`} d={d} className="cs-flow-dash" stroke="url(#libStreamGreen)" />
          ))}
        </g>
        {/* Green packets riding the rails into the container. */}
        {greenStreams.map((d, i) => (
          <g
            key={`gp-${i}`}
            className="cs-lib-packet"
            style={{ offsetPath: `path('${d}')`, animationDelay: `${i * 0.42}s` }}
          >
            <circle r={8} fill="url(#libGlow-green)" filter="url(#libBloom)" />
            <circle r={2.8} fill="#eafff3" />
          </g>
        ))}

        {/* Filter membrane — faint bright arc on the entry (left) side. */}
        <path
          d={`M ${C.cx - 64} ${C.cy - C.ry + 40} A ${C.rx} ${C.ry} 0 0 0 ${C.cx - 64} ${C.cy + C.ry - 40}`}
          fill="none"
          stroke="#9fdcff"
          strokeWidth={1.4}
          strokeOpacity={0.4}
          strokeDasharray="2 6"
        />

        {/* Accepted clean packages, inside. */}
        {GREEN_INSIDE.map((cube, i) => (
          <Cube key={`gi-${i}`} {...cube} />
        ))}

        {/* Code card — double frame + top gloss, tilted in faux-3D. */}
        <g transform="translate(620 286) skewX(-11) scale(1.04 0.9) rotate(-5) translate(-620 -286)">
          <rect x={490} y={170} width={262} height={234} rx={16} fill="#0d1130" stroke="rgba(138,166,255,0.35)" strokeWidth={1.2} />
          <rect x={498} y={178} width={246} height={218} rx={12} fill="none" stroke="rgba(138,166,255,0.16)" strokeWidth={1} />
          <rect x={490} y={170} width={262} height={70} rx={16} fill="url(#libCardGloss)" />
          <circle cx={510} cy={194} r={3.6} fill="#ff6b6b" />
          <circle cx={523} cy={194} r={3.6} fill="#ffcf5c" />
          <circle cx={536} cy={194} r={3.6} fill="#5ad6a0" />
          <line x1={528} y1={212} x2={528} y2={388} stroke="rgba(138,166,255,0.18)" strokeWidth={1} />
          {CODE_LINES.map((line, i) => (
            <g key={`row-${i}`}>
              <rect x={508} y={220 + i * 13} width={11} height={3} rx={1.5} fill="rgba(176,190,255,0.32)" />
              <rect
                x={538 + line.indent}
                y={219 + i * 13}
                width={line.width}
                height={4.2}
                rx={2}
                fill={line.color}
                fillOpacity={0.92}
              />
            </g>
          ))}
        </g>
      </g>

      {/* Vulnerable packages — outside, with blocked badges. */}
      {AMBER_BLOCKED.map((cube, i) => (
        <Cube key={`a-${i}`} {...cube} />
      ))}
      {amberData.map((a, i) => (
        <BlockedBadge key={`bb-${i}`} {...a.stop} />
      ))}

      {/* Foreground clean package field. */}
      {GREEN_IN.map((cube, i) => (
        <Cube key={`g-${i}`} {...cube} />
      ))}

      {/* Amber packets — rush the gate, then recoil + fade (repelled). */}
      {amberData.map((a, i) => (
        <g
          key={`ap-${i}`}
          className="cs-lib-packet-amber"
          style={{ offsetPath: `path('${a.d}')`, animationDelay: `${i * 0.5}s` }}
        >
          <circle r={7} fill="url(#libGlow-amber)" filter="url(#libBloom)" />
          <circle r={2.6} fill="#ffd9c2" />
        </g>
      ))}

      {/* Ambient sparkles. */}
      {SPARKS.map((p, i) => (
        <circle
          key={`sp-${i}`}
          cx={p.x}
          cy={p.y}
          r={1.6}
          fill="#bfe9ff"
          className="cs-lib-twinkle"
          style={{ animationDelay: `${i * 0.6}s` }}
        />
      ))}

      {/* Floor reflection. */}
      <ellipse cx={C.cx} cy={C.cy + C.ry + 36} rx={C.rx - 16} ry={22} fill="url(#libBlobGlow)" opacity={0.45} />
    </svg>
  );
}
