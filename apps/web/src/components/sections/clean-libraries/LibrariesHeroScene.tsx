/**
 * Clean Libraries hero scene — built entirely in SVG/CSS (no raster).
 *
 * The metaphor: a depth-layered sprawl of software dependency packages
 * (green = healthy, amber = at-risk) flows along glowing connector streams,
 * converging on two entry ports of a luminous, secure code container.
 *
 * Fidelity techniques (to escape the flat "vector" look):
 *   - cube faces are gradient-lit (bright top ridge → shaded sides) with an
 *     emissive top edge, each sitting on a blurred colored bloom;
 *   - a blurred, dimmed back layer of distant cubes gives atmospheric depth;
 *   - the container uses stacked glows (wide outer bloom + bright thin rim) over
 *     a vignetted dark interior, with a double-framed, top-glossed code card.
 *
 * Motion is paint/transform-only and reuses the repo system: `cs-flow-dash`
 * drifts the dotted streams, `cs-libhero-breathe` pulses the glows, and the
 * parent's `cs-libhero-float` drifts the whole scene. All disabled under
 * `prefers-reduced-motion` (see globals.css), leaving a clean static scene.
 */

type CubeTone = "green" | "amber";

interface CubeSpec {
  x: number;
  y: number;
  scale: number;
  tone: CubeTone;
}

interface StreamSpec {
  d: string;
  tone: CubeTone;
}

interface CodeLine {
  indent: number;
  width: number;
  color: string;
}

/** Foreground packages — crisp, bright, varied depth via scale. */
const FRONT_CUBES: readonly CubeSpec[] = [
  { x: 118, y: 132, scale: 1.45, tone: "green" },
  { x: 214, y: 196, scale: 1.05, tone: "amber" },
  { x: 84, y: 250, scale: 1.2, tone: "green" },
  { x: 178, y: 300, scale: 1.55, tone: "green" },
  { x: 268, y: 268, scale: 1.0, tone: "amber" },
  { x: 128, y: 374, scale: 1.3, tone: "green" },
  { x: 224, y: 408, scale: 1.1, tone: "green" },
  { x: 66, y: 338, scale: 0.95, tone: "green" },
];

/** Background packages — blurred + dimmed for atmospheric depth. */
const BACK_CUBES: readonly CubeSpec[] = [
  { x: 36, y: 108, scale: 0.62, tone: "green" },
  { x: 250, y: 116, scale: 0.58, tone: "green" },
  { x: 308, y: 178, scale: 0.6, tone: "amber" },
  { x: 30, y: 196, scale: 0.55, tone: "green" },
  { x: 322, y: 330, scale: 0.6, tone: "green" },
  { x: 58, y: 446, scale: 0.62, tone: "green" },
  { x: 198, y: 484, scale: 0.58, tone: "green" },
  { x: 300, y: 430, scale: 0.55, tone: "green" },
];

const PORT_A = { x: 404, y: 262 };
const PORT_B = { x: 410, y: 338 };

const STREAMS: readonly StreamSpec[] = [
  { d: `M 150 168 C 280 196, 330 236, ${PORT_A.x} ${PORT_A.y}`, tone: "green" },
  { d: `M 240 210 C 320 230, 360 248, ${PORT_A.x} ${PORT_A.y}`, tone: "amber" },
  { d: `M 116 270 C 250 282, 330 268, ${PORT_A.x} ${PORT_A.y}`, tone: "green" },
  { d: `M 296 286 C 350 300, 380 322, ${PORT_B.x} ${PORT_B.y}`, tone: "amber" },
  { d: `M 160 392 C 280 372, 350 350, ${PORT_B.x} ${PORT_B.y}`, tone: "green" },
  { d: `M 252 426 C 330 404, 370 364, ${PORT_B.x} ${PORT_B.y}`, tone: "green" },
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

const BLOB_PATH =
  "M 512 96 C 600 70 706 84 752 134 C 806 168 822 244 800 308 C 826 380 778 452 700 478 C 638 514 536 520 484 492 C 424 510 356 484 344 422 C 318 372 332 312 366 282 C 332 224 372 150 440 132 C 462 106 486 102 512 96 Z";

function Cube({ x, y, scale, tone }: CubeSpec): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={28} rx={30} ry={18} fill={`url(#libGlow-${tone})`} filter="url(#libBloom)" />
      <polygon points="0,0 20,10 0,20 -20,10" fill={`url(#libTop-${tone})`} />
      <polygon points="-20,10 0,20 0,44 -20,34" fill={`url(#libLeft-${tone})`} />
      <polygon points="20,10 0,20 0,44 20,34" fill={`url(#libRight-${tone})`} />
      {/* Emissive top ridge. */}
      <polyline points="-20,10 0,0 20,10" fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={0.9} />
      {/* Vertical front edge sheen. */}
      <line x1={0} y1={20} x2={0} y2={44} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={0.7} />
    </g>
  );
}

export function LibrariesHeroScene(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 820 600"
      role="img"
      aria-label="Green and amber software dependency packages flowing along connector streams into a glowing secure code container"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full select-none"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Cube face gradients — bright top, shaded sides, for lit volume. */}
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

        {/* Cube blooms. */}
        <radialGradient id="libGlow-green" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#46e08a" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#46e08a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="libGlow-amber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9d3d" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#ff9d3d" stopOpacity={0} />
        </radialGradient>

        {/* Container glows + interior. */}
        <radialGradient id="libBlobGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#62b4ff" stopOpacity={0.6} />
          <stop offset="45%" stopColor="#7a86ff" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#8a56ff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="libBlobBody" cx="46%" cy="40%" r="62%">
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
          <stop offset="0%" stopColor="#ff9d3d" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#ffc888" stopOpacity={1} />
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
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>

      {/* Ambient backdrop bloom behind the whole scene. */}
      <g className="cs-libhero-breathe" style={{ transformOrigin: "560px 300px", transformBox: "fill-box" }}>
        <ellipse cx={560} cy={300} rx={260} ry={240} fill="url(#libBlobGlow)" />
      </g>

      {/* Distant package field — blurred + dimmed. */}
      <g filter="url(#libDepthBlur)" opacity={0.5}>
        {BACK_CUBES.map((cube, i) => (
          <Cube key={`b-${i}`} {...cube} />
        ))}
      </g>

      {/* Connector streams — gradient-bright toward the ports, dotted + flowing. */}
      <g fill="none" strokeLinecap="round" strokeWidth={2.6} strokeDasharray="1 7">
        {STREAMS.map((s, i) => (
          <path
            key={`s-${i}`}
            d={s.d}
            className="cs-flow-dash"
            stroke={s.tone === "green" ? "url(#libStreamGreen)" : "url(#libStreamAmber)"}
          />
        ))}
      </g>

      {/* Foreground package field. */}
      {FRONT_CUBES.map((cube, i) => (
        <Cube key={`f-${i}`} {...cube} />
      ))}

      {/* The secure code container. */}
      <g>
        {/* Wide outer bloom. */}
        <path d={BLOB_PATH} fill="none" stroke="url(#libBlobRim)" strokeWidth={16} strokeOpacity={0.4} filter="url(#libWideGlow)" />
        {/* Vignetted interior. */}
        <path d={BLOB_PATH} fill="url(#libBlobBody)" />
        {/* Bright rim glow + crisp rim line. */}
        <path d={BLOB_PATH} fill="none" stroke="url(#libBlobRim)" strokeWidth={6} strokeOpacity={0.55} filter="url(#libRimGlow)" />
        <path d={BLOB_PATH} fill="none" stroke="url(#libBlobRim)" strokeWidth={2.4} />

        {/* Glowing entry ports where streams meet the container. */}
        <circle cx={PORT_A.x} cy={PORT_A.y} r={9} fill="#9affc6" filter="url(#libBloom)" />
        <circle cx={PORT_A.x} cy={PORT_A.y} r={3.2} fill="#eafff3" />
        <circle cx={PORT_B.x} cy={PORT_B.y} r={9} fill="#ffc888" filter="url(#libBloom)" />
        <circle cx={PORT_B.x} cy={PORT_B.y} r={3.2} fill="#fff3e2" />

        {/* Code card — double frame + top gloss, tilted in faux-3D so it sits
            at an angle inside the container (matches the reference). The
            transform centres the card, leans + foreshortens it, then restores
            position (SVG transform list applies right-to-left). */}
        <g transform="translate(617 283) skewX(-11) scale(1.04 0.9) rotate(-5) translate(-617 -283)">
          <rect x={486} y={166} width={262} height={234} rx={16} fill="#0d1130" stroke="rgba(138,166,255,0.35)" strokeWidth={1.2} />
          <rect x={494} y={174} width={246} height={218} rx={12} fill="none" stroke="rgba(138,166,255,0.16)" strokeWidth={1} />
          <rect x={486} y={166} width={262} height={70} rx={16} fill="url(#libCardGloss)" />
          {/* Title bar dots. */}
          <circle cx={506} cy={190} r={3.6} fill="#ff6b6b" />
          <circle cx={519} cy={190} r={3.6} fill="#ffcf5c" />
          <circle cx={532} cy={190} r={3.6} fill="#5ad6a0" />
          {/* Gutter divider. */}
          <line x1={524} y1={208} x2={524} y2={384} stroke="rgba(138,166,255,0.18)" strokeWidth={1} />
          {/* Line-number ticks + code lines. */}
          {CODE_LINES.map((line, i) => (
            <g key={`row-${i}`}>
              <rect x={504} y={216 + i * 13} width={11} height={3} rx={1.5} fill="rgba(176,190,255,0.32)" />
              <rect
                x={534 + line.indent}
                y={215 + i * 13}
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

      {/* Floor reflection. */}
      <ellipse cx={560} cy={528} rx={190} ry={22} fill="url(#libBlobGlow)" opacity={0.45} />
    </svg>
  );
}
