import type React from 'react';

/*
 * SaaS hero artifact — the application, and everything it is assembled from.
 *
 * Client direction with a reference: no container, no base object. A central
 * application surface carrying the complexity of a real product, with the pieces
 * it is built from floating around it.
 *
 * THE SURFACE. Earlier passes drew it as grey bars on white, which read as a
 * wireframe: stat tiles holding no value, identical list rows, a rail of
 * featureless blobs, no header and no primary action. Hierarchy and colour are
 * what make a UI look real, so it now carries a header with a filled action and
 * a tab strip, drawn rail icons with one active, three stat tiles with values, a
 * list whose rows differ from one another with one selected, and a side panel so
 * the body is not one flat column.
 *
 * THE PIECES. Overlapping the surface and each other, in front and behind;
 * translucent, so the surface reads through them; each on its own tint rather
 * than one fill repeated, which was flattening them into a single material.
 * Variety of object, not just of position: code badge, cog panel, package,
 * avatar row, manifest, image grid, selection frame, terminal, dependency graph.
 *
 * Depth is built in three ways: the back row is blurred slightly so it sits
 * behind rather than merely under, dashed tethers tie every piece back to the
 * surface so they are not confetti, and a particle field fills the corners the
 * cards do not reach.
 *
 * Built in code, not as an image: rounded rectangles, flat fills, small glyphs
 * and rotations are native to SVG. Code holds exact brand colour, stays crisp at
 * every DPR and costs a few KB. It also sidesteps the reference asset itself,
 * which is a free stock vector — attribution-bound and already on thousands of
 * sites.
 *
 * The security story lives in WHAT floats: source, base images, packages,
 * libraries, a signed manifest, a dependency graph, several carrying a verified
 * tick. That is what keeps this container security rather than generic app
 * development.
 *
 * No numerals or words anywhere. The artifact scales from 599px down to 316px,
 * where real type would be illegible, so hierarchy is carried by weight, size
 * and colour instead.
 */

const VIEW_W = 580;
const VIEW_H = 460;

const APP_X = 140;
const APP_Y = 78;
const APP_W = 312;
const APP_H = 302;

const RAIL_W = 44;
const PAD = 14;
const BODY_X = APP_X + RAIL_W + PAD;
const BODY_W = APP_W - RAIL_W - PAD * 2;
const LIST_W = 152;
const SIDE_X = BODY_X + LIST_W + 12;
const SIDE_W = BODY_W - LIST_W - 12;

const BLUE = '#005be3';
const VIOLET = '#7c34e8';
const TEAL = '#0f9fd0';
const CYAN = '#4fe3ff';

const INK_STRONG = 'rgba(16,19,34,0.44)';
const INK_SOFT = 'rgba(16,19,34,0.17)';
const HAIR = 'rgba(16,19,34,0.08)';

const ROWS = [
  { chip: BLUE, name: 78, sub: 50, selected: true },
  { chip: VIOLET, name: 62, sub: 42, selected: false },
  { chip: TEAL, name: 86, sub: 36, selected: false },
] as const;

const STATS = [
  { accent: BLUE, value: 24 },
  { accent: VIOLET, value: 17 },
  { accent: TEAL, value: 28 },
] as const;

/** Small drifting marks in the corners the cards never reach. Fixed positions,
    not random: the artifact renders on the server and must match on the client. */
const PARTICLES = [
  { x: 26, y: 32, r: 2.4, o: 0.3 },
  { x: 62, y: 14, r: 1.6, o: 0.2 },
  { x: 546, y: 60, r: 2.2, o: 0.26 },
  { x: 566, y: 132, r: 1.5, o: 0.18 },
  { x: 18, y: 300, r: 1.8, o: 0.22 },
  { x: 38, y: 430, r: 2.3, o: 0.26 },
  { x: 300, y: 440, r: 1.6, o: 0.18 },
  { x: 556, y: 400, r: 2, o: 0.22 },
  { x: 522, y: 246, r: 1.5, o: 0.16 },
] as const;

function Tick({ x, y, r = 9 }: { x: number; y: number; r?: number }): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="url(#csa-seal)" stroke="rgba(255,255,255,0.62)" strokeWidth={1.1} />
      <path
        d={`M${-r * 0.42},${r * 0.02} L${-r * 0.12},${r * 0.34} L${r * 0.46},${-r * 0.32}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={r * 0.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Lines({
  x,
  y,
  widths,
  gap = 8,
  opacity = 0.3,
}: {
  x: number;
  y: number;
  widths: readonly number[];
  gap?: number;
  opacity?: number;
}): React.ReactElement {
  return (
    <g>
      {widths.map((w, i) => (
        <rect
          key={`${w}-${i}`}
          x={x}
          y={y + i * gap}
          width={w}
          height={3}
          rx={1.5}
          fill={`rgba(255,255,255,${opacity})`}
        />
      ))}
    </g>
  );
}

function Cog({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x={-1.7}
          y={-r - 3.2}
          width={3.4}
          height={4.2}
          rx={1}
          fill={fill}
          transform={`rotate(${i * 45})`}
        />
      ))}
      <circle r={r} fill="none" stroke={fill} strokeWidth={2.4} />
      <circle r={r * 0.34} fill={fill} />
    </g>
  );
}

/** Rail glyphs, actually drawn. Grey blobs made the rail read as a placeholder
    rather than as navigation. */
function RailIcon({ i, active }: { i: number; active: boolean }): React.ReactElement {
  const c = active ? '#ffffff' : 'rgba(16,19,34,0.34)';
  if (i === 0) {
    return (
      <g>
        {[0, 1, 2, 3].map((k) => (
          <rect
            key={k}
            x={4 + (k % 2) * 7}
            y={4 + Math.floor(k / 2) * 7}
            width={5}
            height={5}
            rx={1.2}
            fill={c}
          />
        ))}
      </g>
    );
  }
  if (i === 1) {
    return (
      <g>
        {[0, 1, 2].map((k) => (
          <rect key={k} x={4} y={5 + k * 5} width={12} height={2} rx={1} fill={c} />
        ))}
      </g>
    );
  }
  if (i === 2) {
    return (
      <rect x={4} y={4} width={12} height={12} rx={2.5} fill="none" stroke={c} strokeWidth={2} />
    );
  }
  if (i === 3) {
    return (
      <path
        d="M10,3.6 L16,6.4 L16,10.4 C16,13.6 10,16.4 10,16.4 C10,16.4 4,13.6 4,10.4 L4,6.4 Z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    );
  }
  return (
    <g>
      <circle cx={10} cy={10} r={4.4} fill="none" stroke={c} strokeWidth={1.8} />
      <circle cx={10} cy={10} r={1.4} fill={c} />
    </g>
  );
}

function Shell({
  w,
  h,
  fill,
  accent,
  radius = 10,
}: {
  w: number;
  h: number;
  fill: string;
  accent: string;
  radius?: number;
}): React.ReactElement {
  return <rect width={w} height={h} rx={radius} fill={fill} stroke={accent} strokeWidth={1.1} />;
}

function Handles({ w, h }: { w: number; h: number }): React.ReactElement {
  return (
    <g>
      <rect width={w} height={h} fill="none" stroke={CYAN} strokeWidth={1} strokeOpacity={0.8} />
      {(
        [
          [0, 0],
          [w, 0],
          [0, h],
          [w, h],
        ] as const
      ).map(([px, py]) => (
        <rect
          key={`${px}-${py}`}
          x={px - 3}
          y={py - 3}
          width={6}
          height={6}
          fill="#0a1030"
          stroke={CYAN}
          strokeWidth={1.2}
        />
      ))}
    </g>
  );
}

/** Dependency graph: the one piece that is a relationship rather than an object,
    which is what a supply chain actually is. */
function Graph(): React.ReactElement {
  const nodes = [
    { x: 12, y: 30, r: 7, fill: CYAN },
    { x: 48, y: 12, r: 5, fill: 'rgba(255,255,255,0.6)' },
    { x: 52, y: 48, r: 6, fill: '#b47cff' },
    { x: 86, y: 28, r: 4.5, fill: 'rgba(255,255,255,0.5)' },
    { x: 84, y: 60, r: 5.5, fill: CYAN },
  ] as const;
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [2, 4],
  ] as const;
  return (
    <g>
      {edges.map(([a, b]) => {
        const na = nodes[a];
        const nb = nodes[b];
        if (!na || !nb) return null;
        return (
          <line
            key={`${a}-${b}`}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke="rgba(255,255,255,0.26)"
            strokeWidth={1.1}
          />
        );
      })}
      {nodes.map((n) => (
        <circle key={`${n.x}-${n.y}`} cx={n.x} cy={n.y} r={n.r} fill={n.fill} />
      ))}
    </g>
  );
}

export function SaasHeroAppSurface(): React.ReactElement {
  const cx = APP_X + APP_W / 2;
  const cy = APP_Y + APP_H / 2;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      className="block w-full"
    >
      <defs>
        <linearGradient id="csa-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2f7ae6" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#16266b" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="csa-violet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b4dea" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2a1c72" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="csa-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1fa9d8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#14306e" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="csa-deep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#243a92" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#111a4d" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="csa-term" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d1745" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#0a1030" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="csa-seal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b47cff" />
          <stop offset="100%" stopColor="#7c34e8" />
        </linearGradient>
        {/* Bright at the BASE, fading to the tip. Inverted stops lit the far ends
            and turned the fan into a dark crown ringing the surface. */}
        <linearGradient id="csa-ray" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4fe3ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#4fe3ff" stopOpacity="0.13" />
        </linearGradient>
        <radialGradient id="csa-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#239cff" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#5b6bff" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
        </radialGradient>
        {/* Depth-of-field on the back row only. One shared filter, small stdDev:
            enough to push those cards behind the surface, cheap enough not to
            matter. */}
        <filter id="csa-back" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <ellipse cx={VIEW_W / 2} cy={VIEW_H / 2} rx={280} ry={226} fill="url(#csa-glow)" />

      <g className="cs-hero-fade" style={{ animationDelay: '80ms' }}>
        {[-62, -40, -20, 0, 20, 40, 62].map((a) => (
          <polygon
            key={a}
            points="-9,0 9,0 26,-212 -26,-212"
            fill="url(#csa-ray)"
            transform={`translate(${cx} ${cy}) rotate(${a})`}
          />
        ))}
        {PARTICLES.map((p) => (
          <circle
            key={`${p.x}-${p.y}`}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={`rgba(160,220,255,${p.o})`}
          />
        ))}
      </g>

      {/* Tethers. Without them the pieces read as confetti; with them every one
          belongs to the application in the middle. */}
      <g className="cs-hero-fade" style={{ animationDelay: '560ms' }}>
        {(
          [
            [96, 120],
            [462, 108],
            [478, 322],
            [126, 262],
            [356, 372],
            [318, 82],
            [512, 192],
            [88, 40],
          ] as const
        ).map(([px, py]) => (
          <line
            key={`${px}-${py}`}
            x1={px}
            y1={py}
            x2={cx}
            y2={cy}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
        ))}
      </g>

      {/* BEHIND the surface, blurred back. */}
      <g className="cs-hero-band" filter="url(#csa-back)" style={{ animationDelay: '260ms' }}>
        <g transform="rotate(7 462 104) translate(396 56)">
          <Shell w={150} h={100} fill="url(#csa-cyan)" accent="rgba(79,227,255,0.4)" />
          <Cog x={34} y={36} r={13} fill="rgba(120,233,255,0.9)" />
          <Cog x={62} y={56} r={8} fill="rgba(180,124,255,0.85)" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={92}
              y={24 + i * 10}
              width={40}
              height={5}
              rx={2.5}
              fill={['#7de9ff', '#b47cff', '#5aa9ff'][i]}
              opacity={0.9}
            />
          ))}
          <Lines x={16} y={74} widths={[118, 96]} opacity={0.24} />
        </g>

        <g transform="rotate(-9 92 120) translate(16 70)">
          <Shell w={144} h={94} fill="url(#csa-violet)" accent="rgba(167,107,255,0.42)" />
          <Handles w={144} h={94} />
          <rect x={14} y={16} width={36} height={32} rx={6} fill="rgba(190,150,255,0.75)" />
          <Lines x={60} y={20} widths={[64, 48]} gap={10} opacity={0.4} />
          <Lines x={14} y={60} widths={[114, 92, 100]} opacity={0.22} />
        </g>

        <g transform="rotate(-5 66 42) translate(20 14)">
          <Graph />
        </g>
      </g>

      {/* THE APPLICATION SURFACE */}
      <g className="cs-hero-band" style={{ animationDelay: '140ms' }}>
        <rect
          x={APP_X}
          y={APP_Y}
          width={APP_W}
          height={APP_H}
          rx={14}
          fill="#ffffff"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={1}
        />

        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={APP_X + 18 + i * 11}
            cy={APP_Y + 17}
            r={3.1}
            fill="rgba(16,19,34,0.15)"
          />
        ))}
        <rect x={APP_X + 62} y={APP_Y + 13} width={58} height={8} rx={4} fill={INK_STRONG} />
        <rect
          x={APP_X + APP_W - 100}
          y={APP_Y + 11}
          width={34}
          height={13}
          rx={6.5}
          fill="rgba(16,19,34,0.05)"
        />
        <rect x={APP_X + APP_W - 60} y={APP_Y + 10} width={46} height={15} rx={7.5} fill={BLUE} />
        <line
          x1={APP_X}
          y1={APP_Y + 34}
          x2={APP_X + APP_W}
          y2={APP_Y + 34}
          stroke={HAIR}
          strokeWidth={1}
        />

        <line
          x1={APP_X + RAIL_W}
          y1={APP_Y + 34}
          x2={APP_X + RAIL_W}
          y2={APP_Y + APP_H}
          stroke={HAIR}
          strokeWidth={1}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${APP_X + 12} ${APP_Y + 48 + i * 30})`}>
            <rect width={20} height={20} rx={5.5} fill={i === 0 ? BLUE : 'rgba(16,19,34,0.045)'} />
            <RailIcon i={i} active={i === 0} />
          </g>
        ))}

        {/* Tab strip: another layer of real product structure. */}
        {[36, 30, 26].map((w, i) => (
          <g key={w}>
            <rect
              x={BODY_X + i * 46}
              y={APP_Y + 46}
              width={w}
              height={6}
              rx={3}
              fill={i === 0 ? INK_STRONG : INK_SOFT}
            />
            {i === 0 && (
              <rect x={BODY_X} y={APP_Y + 60} width={36} height={2.4} rx={1.2} fill={BLUE} />
            )}
          </g>
        ))}
        <line
          x1={BODY_X}
          y1={APP_Y + 62}
          x2={BODY_X + BODY_W}
          y2={APP_Y + 62}
          stroke={HAIR}
          strokeWidth={1}
        />

        {STATS.map((s, i) => (
          <g
            key={s.accent}
            transform={`translate(${BODY_X + i * ((BODY_W + 8) / 3)} ${APP_Y + 74})`}
          >
            <rect
              width={(BODY_W - 16) / 3}
              height={44}
              rx={8}
              fill="rgba(16,19,34,0.028)"
              stroke={HAIR}
              strokeWidth={1}
            />
            <circle cx={11} cy={12} r={3.2} fill={s.accent} />
            <rect x={10} y={19} width={s.value} height={9} rx={2.5} fill={INK_STRONG} />
            <rect x={10} y={33} width={32} height={4} rx={2} fill={INK_SOFT} />
          </g>
        ))}

        <rect x={BODY_X} y={APP_Y + 132} width={48} height={6} rx={3} fill={INK_STRONG} />

        {ROWS.map((row, i) => {
          const y = APP_Y + 148 + i * 36;
          return (
            <g key={row.chip + String(i)}>
              {row.selected && (
                <>
                  <rect
                    x={BODY_X - 7}
                    y={y - 4}
                    width={LIST_W + 12}
                    height={32}
                    rx={7}
                    fill="rgba(0,91,227,0.06)"
                  />
                  <rect x={BODY_X - 7} y={y - 4} width={3} height={32} rx={1.5} fill={BLUE} />
                </>
              )}
              <rect
                width={19}
                height={19}
                rx={5}
                x={BODY_X + 2}
                y={y + 2}
                fill={row.chip}
                opacity={0.22}
              />
              <circle cx={BODY_X + 11.5} cy={y + 11.5} r={3.4} fill={row.chip} />
              <rect
                x={BODY_X + 30}
                y={y + 3}
                width={row.name}
                height={6.5}
                rx={3.2}
                fill={INK_STRONG}
              />
              <rect
                x={BODY_X + 30}
                y={y + 15}
                width={row.sub}
                height={4.5}
                rx={2.2}
                fill={INK_SOFT}
              />
            </g>
          );
        })}

        {/* Side panel, so the body is not one flat column. */}
        <rect
          x={SIDE_X}
          y={APP_Y + 128}
          width={SIDE_W}
          height={128}
          rx={9}
          fill="rgba(16,19,34,0.028)"
          stroke={HAIR}
          strokeWidth={1}
        />
        <rect x={SIDE_X + 10} y={APP_Y + 140} width={30} height={5} rx={2.5} fill={INK_STRONG} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle
              cx={SIDE_X + 14}
              cy={APP_Y + 160 + i * 20}
              r={3.4}
              fill={[BLUE, VIOLET, TEAL, BLUE][i]}
            />
            <rect
              x={SIDE_X + 23}
              y={APP_Y + 157 + i * 20}
              width={30 - (i % 2) * 8}
              height={5}
              rx={2.5}
              fill={INK_SOFT}
            />
          </g>
        ))}
        <rect
          x={SIDE_X + 10}
          y={APP_Y + 240}
          width={SIDE_W - 20}
          height={5}
          rx={2.5}
          fill="rgba(16,19,34,0.08)"
        />
        <rect
          x={SIDE_X + 10}
          y={APP_Y + 240}
          width={(SIDE_W - 20) * 0.62}
          height={5}
          rx={2.5}
          fill={BLUE}
        />
      </g>

      {/* IN FRONT, overlapping the surface. */}
      <g className="cs-hero-band" style={{ animationDelay: '380ms' }}>
        {/* Package, moved out of the blurred back row. It sits in FRONT of the
            surface now, so it is sharp and overlaps the window's right edge
            rather than washing out behind it. Placed first in this group so the
            manifest below still crosses over it and the depth stack keeps more
            than two planes. */}
        <g transform="rotate(6 480 324) translate(414 278)">
          <Shell w={142} h={94} fill="url(#csa-violet)" accent="rgba(167,107,255,0.4)" />
          <path
            d="M12,32 L12,18 A5,5 0 0 1 17,13 L38,13 L46,22 L114,22 A5,5 0 0 1 119,27 L119,32 Z"
            fill="rgba(196,158,255,0.8)"
          />
          <rect x={12} y={32} width={107} height={46} rx={5} fill="rgba(96,150,255,0.4)" />
          <Lines x={22} y={46} widths={[78, 58]} gap={10} opacity={0.5} />
          <Tick x={126} y={16} r={10} />
        </g>

        <g transform="rotate(-6 122 264) translate(50 222)">
          <Shell w={146} h={86} fill="url(#csa-blue)" accent="rgba(120,190,255,0.4)" />
          <circle cx={31} cy={31} r={16} fill="none" stroke={CYAN} strokeWidth={2} opacity={0.9} />
          <circle cx={31} cy={26} r={6} fill="rgba(120,233,255,0.9)" />
          <path
            d="M19,43 A14,10 0 0 1 43,43"
            fill="none"
            stroke={CYAN}
            strokeWidth={2}
            opacity={0.9}
          />
          <Lines x={60} y={20} widths={[68, 52, 60]} gap={10} opacity={0.42} />
          <Lines x={16} y={64} widths={[114, 92]} opacity={0.2} />
        </g>

        <g transform="rotate(5 356 376) translate(272 344)">
          <Shell w={170} h={72} fill="url(#csa-deep)" accent="rgba(255,255,255,0.26)" />
          <Lines x={14} y={14} widths={[142, 124, 134, 106]} opacity={0.32} />
          <rect x={14} y={52} width={88} height={4} rx={2} fill="rgba(120,233,255,0.75)" />
          <Tick x={152} y={16} r={10} />
        </g>

        <g transform="rotate(-8 318 78) translate(264 48)">
          <Shell w={112} h={62} fill="url(#csa-blue)" accent="rgba(120,190,255,0.44)" radius={9} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={12 + (i % 3) * 23}
              y={12 + Math.floor(i / 3) * 20}
              width={18}
              height={15}
              rx={3}
              fill={i === 1 || i === 3 ? 'rgba(122,197,255,0.92)' : 'rgba(255,255,255,0.2)'}
            />
          ))}
          <Tick x={100} y={12} r={9} />
        </g>

        {/* Terminal: the one piece that says a human builds this. */}
        <g transform="rotate(4 512 194) translate(452 156)">
          <Shell w={120} h={76} fill="url(#csa-term)" accent="rgba(120,190,255,0.34)" radius={9} />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={12 + i * 9}
              cy={12}
              r={2.6}
              fill={['#ff6b5a', '#ffc44d', '#4fe3ff'][i]}
              opacity={0.85}
            />
          ))}
          <line x1={0} y1={22} x2={120} y2={22} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <rect x={12} y={32} width={7} height={3} rx={1.5} fill="#7de9ff" />
          <Lines x={24} y={32} widths={[62]} opacity={0.34} />
          <rect x={12} y={44} width={7} height={3} rx={1.5} fill="#7de9ff" />
          <Lines x={24} y={44} widths={[44]} opacity={0.3} />
          <rect x={12} y={56} width={7} height={3} rx={1.5} fill="#b47cff" />
          <Lines x={24} y={56} widths={[74]} opacity={0.26} />
          <rect x={12} y={66} width={5} height={5} rx={1} fill="rgba(125,233,255,0.9)" />
        </g>

        <g transform="rotate(9 86 376) translate(50 348)">
          <Shell w={80} h={62} fill="url(#csa-cyan)" accent="rgba(79,227,255,0.5)" radius={15} />
          <path
            d="M27,22 L19,31 L27,40 M53,22 L61,31 L53,40"
            fill="none"
            stroke="#8beeff"
            strokeWidth={2.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1={45}
            y1={19}
            x2={35}
            y2={43}
            stroke="#c9a6ff"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
