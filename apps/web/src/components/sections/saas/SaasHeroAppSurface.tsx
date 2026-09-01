import type React from 'react';

/*
 * SaaS hero artifact — the application, and everything it is assembled from.
 *
 * Client direction with a reference: no container, no base object. A central
 * application surface carrying the complexity of a real product, with the pieces
 * it is built from floating around it.
 *
 * A first pass sat six tidy, well-separated, identically-styled cards around the
 * window and read as far too simple next to the reference. What the reference
 * actually does, and what this now does:
 *
 *   - Cards OVERLAP the window and each other, some in front and some behind.
 *     Separation is what made the first pass look sparse.
 *   - Cards are TRANSLUCENT, so the surface reads through them. That is what
 *     creates depth rather than a flat collage.
 *   - Real object VARIETY, not one card repeated: a code badge, a cog panel, a
 *     package, an avatar row, a dense manifest, an image grid, a selection frame
 *     with corner handles.
 *   - Fine internal DETAIL — thin line runs, small bars — so each piece looks
 *     like it contains something.
 *   - Rays behind the subject.
 *
 * Built in code, not as an image: rounded rectangles, flat fills, small glyphs
 * and rotations are native to SVG. Code holds exact brand colour, stays crisp at
 * every DPR and costs a few KB. It also sidesteps the reference asset itself,
 * which is a free stock vector — attribution-bound and already on thousands of
 * sites.
 *
 * The security story lives in WHAT floats. These are the things a SaaS
 * application is assembled from — source, base images, packages, libraries, a
 * signed manifest — and several carry a verified tick. That is what keeps this
 * container security rather than generic app development, and it is the reason
 * the composition belongs on this page and not on any other landing page using
 * the same reference.
 *
 * The reference's pink/teal palette and its scattered bubbles are not copied.
 * Brand blue, cyan and violet only, and no confetti: that decorative layer is
 * the stock-vector look the client rejected in the original render.
 */

const VIEW_W = 580;
const VIEW_H = 460;

const APP_X = 150;
const APP_Y = 92;
const APP_W = 268;
const APP_H = 268;

const BLUE = '#239cff';
const CYAN = '#4fe3ff';
const VIOLET = '#a76bff';

function Tick({ x, y, r = 9 }: { x: number; y: number; r?: number }): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="url(#csa-seal)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.1} />
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

/** Thin line runs. The reference's cards all look full of something. */
function Lines({
  x,
  y,
  widths,
  gap = 7,
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

/** Shared card shell: translucent, so whatever it overlaps shows through. */
function Shell({
  w,
  h,
  accent,
  radius = 10,
}: {
  w: number;
  h: number;
  accent?: string;
  radius?: number;
}): React.ReactElement {
  return (
    <rect
      width={w}
      height={h}
      rx={radius}
      fill="url(#csa-card)"
      stroke={accent ?? 'rgba(255,255,255,0.2)'}
      strokeWidth={1.1}
    />
  );
}

/** Design-tool selection frame. Straight from the reference, and it earns its
    place here: it reads as a component being worked on, not just decoration. */
function Handles({ w, h }: { w: number; h: number }): React.ReactElement {
  const pts: readonly (readonly [number, number])[] = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ];
  return (
    <g>
      <rect width={w} height={h} fill="none" stroke={CYAN} strokeWidth={1} strokeOpacity={0.75} />
      {pts.map(([px, py]) => (
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
        <linearGradient id="csa-card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2b6fd8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1b2a72" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id="csa-seal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b47cff" />
          <stop offset="100%" stopColor="#7c34e8" />
        </linearGradient>
        {/* Bright at the BASE, fading to the tip. The stops were the other way
            round at first, which lit the far ends and turned the fan into a dark
            crown ringing the surface instead of light coming from behind it.
            The polygon runs from y=-210 (tip, bbox top) to y=0 (base, bottom). */}
        <linearGradient id="csa-ray" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4fe3ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#4fe3ff" stopOpacity="0.13" />
        </linearGradient>
        <radialGradient id="csa-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#239cff" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#5b6bff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={VIEW_W / 2} cy={VIEW_H / 2} rx={278} ry={224} fill="url(#csa-glow)" />

      {/* Rays fanning from behind the surface. */}
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

      {/* BEHIND the surface. Overlap is what stops the composition reading as a
          tidy ring of separate cards. */}
      <g className="cs-hero-band" style={{ animationDelay: '260ms' }}>
        <g transform="rotate(7 452 108) translate(388 62)">
          <Shell w={148} h={104} accent="rgba(79,227,255,0.34)" />
          <Cog x={34} y={34} r={13} fill="rgba(79,227,255,0.75)" />
          <Cog x={62} y={54} r={8} fill="rgba(167,107,255,0.75)" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={92}
              y={22 + i * 9}
              width={38}
              height={5}
              rx={2.5}
              fill={[CYAN, VIOLET, BLUE][i]}
              opacity={0.85}
            />
          ))}
          <Lines x={16} y={74} widths={[116, 96, 108]} gap={8} opacity={0.26} />
        </g>

        <g transform="rotate(-9 96 128) translate(22 78)">
          <Shell w={140} h={92} />
          <Handles w={140} h={92} />
          <rect x={14} y={16} width={34} height={30} rx={6} fill="rgba(167,107,255,0.6)" />
          <Lines x={58} y={20} widths={[62, 48]} gap={9} opacity={0.34} />
          <Lines x={14} y={56} widths={[110, 88, 96]} gap={8} opacity={0.22} />
        </g>

        <g transform="rotate(6 470 322) translate(404 276)">
          <Shell w={140} h={94} accent="rgba(167,107,255,0.36)" />
          <path
            d="M12,30 L12,18 A5,5 0 0 1 17,13 L38,13 L46,22 L112,22 A5,5 0 0 1 117,27 L117,30 Z"
            fill="rgba(167,107,255,0.55)"
          />
          <rect x={12} y={30} width={105} height={46} rx={5} fill="rgba(79,176,255,0.34)" />
          <Lines x={22} y={44} widths={[76, 58]} gap={9} opacity={0.42} />
          <Tick x={124} y={16} r={10} />
        </g>
      </g>

      {/* The application surface. Light against the dark hero so it is
          unmistakably the subject, and dense enough to read as a real product. */}
      <g className="cs-hero-band" style={{ animationDelay: '140ms' }}>
        <rect
          x={APP_X}
          y={APP_Y}
          width={APP_W}
          height={APP_H}
          rx={14}
          fill="#f7f9fe"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1}
        />
        <line
          x1={APP_X}
          y1={APP_Y + 30}
          x2={APP_X + APP_W}
          y2={APP_Y + 30}
          stroke="rgba(16,19,34,0.09)"
          strokeWidth={1}
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={APP_X + 18 + i * 12}
            cy={APP_Y + 15}
            r={3.2}
            fill="rgba(16,19,34,0.16)"
          />
        ))}
        <rect
          x={APP_X + APP_W - 70}
          y={APP_Y + 9}
          width={52}
          height={12}
          rx={6}
          fill="rgba(16,19,34,0.06)"
        />
        <line
          x1={APP_X + 50}
          y1={APP_Y + 30}
          x2={APP_X + 50}
          y2={APP_Y + APP_H}
          stroke="rgba(16,19,34,0.09)"
          strokeWidth={1}
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={APP_X + 17}
            y={APP_Y + 46 + i * 25}
            width={17}
            height={13}
            rx={4}
            fill={i === 0 ? '#005be3' : 'rgba(16,19,34,0.08)'}
          />
        ))}
        {[0, 1].map((i) => (
          <g key={i}>
            <rect
              x={APP_X + 64 + i * 100}
              y={APP_Y + 44}
              width={88}
              height={42}
              rx={8}
              fill="rgba(16,19,34,0.035)"
              stroke="rgba(16,19,34,0.07)"
              strokeWidth={1}
            />
            <rect
              x={APP_X + 76 + i * 100}
              y={APP_Y + 55}
              width={16}
              height={4}
              rx={2}
              fill={i === 0 ? '#005be3' : '#9a51ff'}
            />
            <rect
              x={APP_X + 76 + i * 100}
              y={APP_Y + 66}
              width={48 - i * 10}
              height={7}
              rx={3.5}
              fill="rgba(16,19,34,0.22)"
            />
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <circle cx={APP_X + 74} cy={APP_Y + 112 + i * 28} r={7} fill="rgba(0,91,227,0.15)" />
            <rect
              x={APP_X + 90}
              y={APP_Y + 108 + i * 28}
              width={74 - (i % 3) * 13}
              height={7}
              rx={3.5}
              fill="rgba(16,19,34,0.2)"
            />
            <rect
              x={APP_X + APP_W - 58}
              y={APP_Y + 107 + i * 28}
              width={38}
              height={11}
              rx={5.5}
              fill="rgba(0,91,227,0.1)"
              stroke="rgba(0,91,227,0.2)"
              strokeWidth={0.8}
            />
          </g>
        ))}
      </g>

      {/* IN FRONT, overlapping the surface. */}
      <g className="cs-hero-band" style={{ animationDelay: '380ms' }}>
        <g transform="rotate(-6 128 268) translate(56 226)">
          <Shell w={144} h={84} accent="rgba(79,227,255,0.3)" />
          <circle cx={30} cy={30} r={16} fill="none" stroke={CYAN} strokeWidth={2} opacity={0.8} />
          <circle cx={30} cy={25} r={6} fill="rgba(79,227,255,0.8)" />
          <path
            d="M18,42 A14,10 0 0 1 42,42"
            fill="none"
            stroke={CYAN}
            strokeWidth={2}
            opacity={0.8}
          />
          <Lines x={58} y={20} widths={[66, 52, 60]} gap={9} opacity={0.36} />
          <Lines x={16} y={62} widths={[112, 90]} gap={8} opacity={0.2} />
        </g>

        <g transform="rotate(5 352 372) translate(268 340)">
          <Shell w={168} h={70} accent="rgba(255,255,255,0.24)" />
          <Lines x={14} y={14} widths={[140, 122, 132, 104]} gap={8} opacity={0.3} />
          <Lines x={14} y={50} widths={[86]} gap={8} opacity={0.5} />
          <Tick x={150} y={16} r={10} />
        </g>

        <g transform="rotate(-8 316 84) translate(262 54)">
          <Shell w={110} h={62} accent="rgba(79,176,255,0.36)" radius={9} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={12 + (i % 3) * 22}
              y={12 + Math.floor(i / 3) * 20}
              width={17}
              height={15}
              rx={3}
              fill={i === 1 || i === 3 ? 'rgba(79,176,255,0.7)' : 'rgba(255,255,255,0.18)'}
            />
          ))}
          <Tick x={98} y={12} r={9} />
        </g>

        <g transform="rotate(9 84 372) translate(48 344)">
          <Shell w={78} h={62} accent="rgba(79,227,255,0.4)" radius={14} />
          <path
            d="M26,22 L18,31 L26,40 M52,22 L60,31 L52,40"
            fill="none"
            stroke={CYAN}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1={44}
            y1={19}
            x2={34}
            y2={43}
            stroke={VIOLET}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
