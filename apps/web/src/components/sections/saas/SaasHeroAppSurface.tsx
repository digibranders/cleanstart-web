import type React from 'react';

/*
 * SaaS hero artifact — the application, and everything it is assembled from.
 *
 * Client direction with a reference: no container, no base object. A central
 * application surface carrying the complexity of a real product, with the pieces
 * it is built from floating around it.
 *
 * THE SURFACE. Earlier passes drew it as grey bars on white, which read as a
 * wireframe rather than a product: empty stat tiles with no values, five
 * identical rows, a rail of featureless grey blobs, no header and no primary
 * action. What makes a UI look real is hierarchy and colour, so this one has a
 * header with a filled action, drawn rail icons with one active, three stat
 * tiles that actually carry a value, and a list whose rows differ from each
 * other — different chip tints, two-line entries, distinct status pills, and one
 * selected row with an accent rail.
 *
 * THE PIECES. Overlapping the surface and each other, some in front and some
 * behind; translucent, so the surface reads through them; and each on its own
 * tint rather than one fill repeated seven times, which was the other thing
 * flattening the composition. Variety of object, not just of position: a code
 * badge, a cog panel, a package, an avatar row, a dense manifest, an image grid,
 * and a selection frame with corner handles.
 *
 * Built in code, not as an image: rounded rectangles, flat fills, small glyphs
 * and rotations are native to SVG. Code holds exact brand colour, stays crisp at
 * every DPR and costs a few KB. It also sidesteps the reference asset itself,
 * which is a free stock vector — attribution-bound and already on thousands of
 * sites.
 *
 * The security story lives in WHAT floats: source, base images, packages,
 * libraries, a signed manifest, several carrying a verified tick. That is what
 * keeps this container security rather than generic app development.
 *
 * No numerals or words anywhere. The artifact scales from 599px down to 316px,
 * where real type would be illegible, so hierarchy is carried by weight, size
 * and colour instead.
 */

const VIEW_W = 580;
const VIEW_H = 460;

const APP_X = 148;
const APP_Y = 84;
const APP_W = 288;
const APP_H = 292;

const RAIL_W = 44;
const PAD = 15;
const BODY_X = APP_X + RAIL_W + PAD;
const BODY_W = APP_W - RAIL_W - PAD * 2;

const BLUE = '#005be3';
const VIOLET = '#7c34e8';
const TEAL = '#0f9fd0';
const CYAN = '#4fe3ff';

const INK_STRONG = 'rgba(16,19,34,0.44)';
const INK_SOFT = 'rgba(16,19,34,0.17)';
const HAIR = 'rgba(16,19,34,0.08)';

const ROWS = [
  { chip: BLUE, name: 82, sub: 52, selected: true },
  { chip: VIOLET, name: 66, sub: 44, selected: false },
  { chip: TEAL, name: 92, sub: 38, selected: false },
  { chip: BLUE, name: 72, sub: 50, selected: false },
] as const;

const STATS = [
  { accent: BLUE, value: 26 },
  { accent: VIOLET, value: 19 },
  { accent: TEAL, value: 30 },
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

/** Rail glyphs, actually drawn. Grey blobs were what made the rail read as a
    placeholder rather than as navigation. */
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

export function SaasHeroAppSurface(): React.ReactElement {
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
      </defs>

      <ellipse cx={VIEW_W / 2} cy={VIEW_H / 2} rx={278} ry={224} fill="url(#csa-glow)" />

      <g className="cs-hero-fade" style={{ animationDelay: '80ms' }}>
        {[-62, -40, -20, 0, 20, 40, 62].map((a) => (
          <polygon
            key={a}
            points="-9,0 9,0 26,-210 -26,-210"
            fill="url(#csa-ray)"
            transform={`translate(${APP_X + APP_W / 2} ${APP_Y + APP_H / 2}) rotate(${a})`}
          />
        ))}
      </g>

      {/* BEHIND the surface. */}
      <g className="cs-hero-band" style={{ animationDelay: '260ms' }}>
        <g transform="rotate(7 452 104) translate(388 58)">
          <Shell w={150} h={102} fill="url(#csa-cyan)" accent="rgba(79,227,255,0.4)" />
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
          <Lines x={16} y={74} widths={[118, 96, 108]} opacity={0.24} />
        </g>

        <g transform="rotate(-9 96 124) translate(20 74)">
          <Shell w={144} h={94} fill="url(#csa-violet)" accent="rgba(167,107,255,0.42)" />
          <Handles w={144} h={94} />
          <rect x={14} y={16} width={36} height={32} rx={6} fill="rgba(190,150,255,0.75)" />
          <Lines x={60} y={20} widths={[64, 48]} gap={10} opacity={0.4} />
          <Lines x={14} y={60} widths={[114, 92, 100]} opacity={0.22} />
        </g>

        <g transform="rotate(6 474 322) translate(408 276)">
          <Shell w={142} h={94} fill="url(#csa-violet)" accent="rgba(167,107,255,0.4)" />
          <path
            d="M12,32 L12,18 A5,5 0 0 1 17,13 L38,13 L46,22 L114,22 A5,5 0 0 1 119,27 L119,32 Z"
            fill="rgba(196,158,255,0.8)"
          />
          <rect x={12} y={32} width={107} height={46} rx={5} fill="rgba(96,150,255,0.4)" />
          <Lines x={22} y={46} widths={[78, 58]} gap={10} opacity={0.5} />
          <Tick x={126} y={16} r={10} />
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

        {/* Header: dots, a title, and a filled primary action. */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={APP_X + 18 + i * 11}
            cy={APP_Y + 17}
            r={3.1}
            fill="rgba(16,19,34,0.15)"
          />
        ))}
        <rect x={APP_X + 62} y={APP_Y + 13} width={60} height={8} rx={4} fill={INK_STRONG} />
        <rect x={APP_X + APP_W - 62} y={APP_Y + 10} width={46} height={15} rx={7.5} fill={BLUE} />
        <line
          x1={APP_X}
          y1={APP_Y + 34}
          x2={APP_X + APP_W}
          y2={APP_Y + 34}
          stroke={HAIR}
          strokeWidth={1}
        />

        {/* Rail with drawn icons, one active. */}
        <line
          x1={APP_X + RAIL_W}
          y1={APP_Y + 34}
          x2={APP_X + RAIL_W}
          y2={APP_Y + APP_H}
          stroke={HAIR}
          strokeWidth={1}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${APP_X + 12} ${APP_Y + 50 + i * 30})`}>
            <rect width={20} height={20} rx={5.5} fill={i === 0 ? BLUE : 'rgba(16,19,34,0.045)'} />
            <RailIcon i={i} active={i === 0} />
          </g>
        ))}

        {/* Stat tiles that carry a value. Empty tiles were what made the earlier
            pass read as a placeholder. */}
        {STATS.map((s, i) => (
          <g
            key={s.accent}
            transform={`translate(${BODY_X + i * ((BODY_W + 8) / 3)} ${APP_Y + 48})`}
          >
            <rect
              width={(BODY_W - 16) / 3}
              height={46}
              rx={8}
              fill="rgba(16,19,34,0.028)"
              stroke={HAIR}
              strokeWidth={1}
            />
            <circle cx={11} cy={12} r={3.2} fill={s.accent} />
            <rect x={10} y={20} width={s.value} height={9} rx={2.5} fill={INK_STRONG} />
            <rect x={10} y={34} width={34} height={4} rx={2} fill={INK_SOFT} />
          </g>
        ))}

        <rect x={BODY_X} y={APP_Y + 110} width={52} height={6} rx={3} fill={INK_STRONG} />
        <rect
          x={BODY_X + BODY_W - 30}
          y={APP_Y + 110}
          width={30}
          height={6}
          rx={3}
          fill={INK_SOFT}
        />

        {/* Rows that differ from one another, with one selected. */}
        {ROWS.map((row, i) => {
          const y = APP_Y + 128 + i * 36;
          return (
            <g key={row.chip + String(i)}>
              {row.selected && (
                <>
                  <rect
                    x={BODY_X - 8}
                    y={y - 4}
                    width={BODY_W + 16}
                    height={32}
                    rx={7}
                    fill="rgba(0,91,227,0.06)"
                  />
                  <rect x={BODY_X - 8} y={y - 4} width={3} height={32} rx={1.5} fill={BLUE} />
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
              <rect
                x={BODY_X + BODY_W - 38}
                y={y + 5}
                width={38}
                height={13}
                rx={6.5}
                fill={row.chip}
                opacity={0.13}
              />
              <circle cx={BODY_X + BODY_W - 30} cy={y + 11.5} r={2.6} fill={row.chip} />
            </g>
          );
        })}
      </g>

      {/* IN FRONT, overlapping the surface. */}
      <g className="cs-hero-band" style={{ animationDelay: '380ms' }}>
        <g transform="rotate(-6 126 264) translate(54 222)">
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

        <g transform="rotate(5 356 374) translate(272 342)">
          <Shell w={170} h={72} fill="url(#csa-deep)" accent="rgba(255,255,255,0.26)" />
          <Lines x={14} y={14} widths={[142, 124, 134, 106]} opacity={0.32} />
          <rect x={14} y={52} width={88} height={4} rx={2} fill="rgba(120,233,255,0.75)" />
          <Tick x={152} y={16} r={10} />
        </g>

        <g transform="rotate(-8 318 82) translate(264 52)">
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

        <g transform="rotate(9 86 374) translate(50 346)">
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
