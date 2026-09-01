import type React from 'react';

/*
 * SaaS hero artifact — the application, and everything it is assembled from.
 *
 * Direction from the client, with a reference: no container and no base object.
 * A central application window carrying the complexity of a real product, with
 * the pieces it is built from floating around it at varying depth and angle.
 *
 * Built in code rather than as an image. The style is rounded rectangles, flat
 * fills, small glyphs and slight rotations, which is native to SVG — an easier
 * build than the isometric container this replaces, where every vertex had to be
 * projected by hand. Code also keeps exact brand colour, stays crisp at every
 * DPR, costs a few KB instead of a raster, and sidesteps the reference asset
 * itself: it is a free stock vector, so it is attribution-bound and already on
 * thousands of sites.
 *
 * The security story lives in WHAT floats. These are not generic UI chrome
 * cards: they are the things a SaaS application is actually assembled from —
 * base images, packages, libraries, source. Three carry a verified tick, so the
 * page reads as container security rather than as app development. That is the
 * whole reason this composition belongs on this page and not on any other
 * landing page using the same reference.
 *
 * The flourishes in the reference (light rays, bubbles, scattered gears) are
 * deliberately restrained. That decorative layer is exactly the stock-vector
 * look the client rejected in the original render.
 */

const VIEW_W = 560;
const VIEW_H = 440;

const APP_X = 132;
const APP_Y = 98;
const APP_W = 296;
const APP_H = 238;

type CardKind = 'code' | 'rows' | 'package' | 'grid' | 'chip';

interface FloatCard {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rot: number;
  readonly kind: CardKind;
  /** Verified components. Not every card: a tick on all of them is wallpaper. */
  readonly tick: boolean;
  /** Anchor point on the app window that this card tethers back to. */
  readonly tether: readonly [number, number];
}

const CARDS: readonly FloatCard[] = [
  { id: 'code', x: 22, y: 40, w: 108, h: 72, rot: -8, kind: 'code', tick: false, tether: [150, 120] },
  { id: 'img', x: 402, y: 34, w: 132, h: 86, rot: 7, kind: 'grid', tick: true, tether: [412, 130] },
  { id: 'pkg', x: 432, y: 182, w: 112, h: 76, rot: -5, kind: 'package', tick: true, tether: [424, 210] },
  { id: 'sig', x: 396, y: 316, w: 124, h: 54, rot: 8, kind: 'chip', tick: true, tether: [408, 306] },
  { id: 'dep', x: 18, y: 288, w: 116, h: 76, rot: 6, kind: 'rows', tick: false, tether: [140, 300] },
  { id: 'lib', x: 6, y: 176, w: 92, h: 60, rot: -6, kind: 'rows', tick: false, tether: [136, 200] },
];

function CardBody({ kind, w, h }: { kind: CardKind; w: number; h: number }): React.ReactElement {
  const pad = 11;
  const bar = (i: number, width: number) => (
    <rect
      key={i}
      x={pad}
      y={h - pad - 6 - i * 11}
      width={width}
      height={5}
      rx={2.5}
      fill={`rgba(255,255,255,${0.3 - i * 0.07})`}
    />
  );

  if (kind === 'code') {
    return (
      <g>
        <path
          d={`M${pad + 6},${h / 2 - 8} L${pad},${h / 2} L${pad + 6},${h / 2 + 8}`}
          fill="none"
          stroke="#4fb0ff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M${pad + 22},${h / 2 - 8} L${pad + 28},${h / 2} L${pad + 22},${h / 2 + 8}`}
          fill="none"
          stroke="#4fb0ff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1={pad + 17}
          y1={h / 2 - 10}
          x2={pad + 11}
          y2={h / 2 + 10}
          stroke="rgba(154,81,255,0.85)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {[0, 1].map((i) => bar(i, w - pad * 2 - (i === 0 ? 26 : 44)))}
      </g>
    );
  }

  if (kind === 'grid') {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={pad + (i % 3) * 24}
            y={pad + Math.floor(i / 3) * 22}
            width={19}
            height={16}
            rx={3}
            fill={i === 1 || i === 4 ? 'rgba(79,176,255,0.55)' : 'rgba(255,255,255,0.16)'}
          />
        ))}
        {bar(0, w - pad * 2 - 20)}
      </g>
    );
  }

  if (kind === 'package') {
    return (
      <g>
        <rect
          x={pad}
          y={pad}
          width={26}
          height={26}
          rx={5}
          fill="rgba(79,176,255,0.5)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
        />
        <line
          x1={pad}
          y1={pad + 9}
          x2={pad + 26}
          y2={pad + 9}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        {[0, 1].map((i) => bar(i, w - pad * 2 - i * 22))}
      </g>
    );
  }

  if (kind === 'chip') {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={i}
            x={pad + i * 13}
            y={h / 2 - 3}
            width={i % 3 === 0 ? 9 : 6}
            height={6}
            rx={2}
            fill={`rgba(255,255,255,${i % 2 === 0 ? 0.34 : 0.18})`}
          />
        ))}
      </g>
    );
  }

  return <g>{[0, 1, 2].map((i) => bar(i, w - pad * 2 - i * 18))}</g>;
}

function Card({ card }: { card: FloatCard }): React.ReactElement {
  const { x, y, w, h, rot, kind, tick } = card;
  return (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2}) translate(${x} ${y})`}>
      <rect
        width={w}
        height={h}
        rx={11}
        fill="url(#csa-card)"
        stroke={tick ? 'rgba(154,81,255,0.38)' : 'rgba(255,255,255,0.17)'}
        strokeWidth={1.1}
      />
      <CardBody kind={kind} w={w} h={h} />
      {tick && (
        <g transform={`translate(${w - 15} 15)`}>
          <circle r={10} fill="url(#csa-seal)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} />
          <path
            d="M-4.2,0.2 L-1.2,3.4 L4.6,-3.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
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
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="csa-seal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b47cff" />
          <stop offset="100%" stopColor="#7c34e8" />
        </linearGradient>
        <radialGradient id="csa-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#239cff" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#5b6bff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={VIEW_W / 2} cy={VIEW_H / 2} rx={266} ry={214} fill="url(#csa-glow)" />

      {/* Tethers, drawn first so they pass behind everything. They are what
          stops the cards reading as unrelated confetti: each one belongs to the
          application in the middle. */}
      <g className="cs-hero-fade" style={{ animationDelay: '520ms' }}>
        {CARDS.map((c) => (
          <line
            key={c.id}
            x1={c.x + c.w / 2}
            y1={c.y + c.h / 2}
            x2={c.tether[0]}
            y2={c.tether[1]}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        ))}
      </g>

      {CARDS.map((c, i) => (
        <g key={c.id} className="cs-hero-band" style={{ animationDelay: `${340 + i * 70}ms` }}>
          <Card card={c} />
        </g>
      ))}

      {/* The application. Light against the dark hero so it is unmistakably the
          subject, and dense enough to read as a real product rather than a
          wireframe: rail, header, two summary tiles, then rows. */}
      <g className="cs-hero-band" style={{ animationDelay: '140ms' }}>
        <rect
          x={APP_X}
          y={APP_Y}
          width={APP_W}
          height={APP_H}
          rx={14}
          fill="#f7f9fe"
          stroke="rgba(255,255,255,0.5)"
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
          x={APP_X + APP_W - 74}
          y={APP_Y + 9}
          width={56}
          height={12}
          rx={6}
          fill="rgba(16,19,34,0.06)"
        />

        <line
          x1={APP_X + 52}
          y1={APP_Y + 30}
          x2={APP_X + 52}
          y2={APP_Y + APP_H}
          stroke="rgba(16,19,34,0.09)"
          strokeWidth={1}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={APP_X + 18}
            y={APP_Y + 48 + i * 26}
            width={18}
            height={14}
            rx={4}
            fill={i === 0 ? '#005be3' : 'rgba(16,19,34,0.08)'}
          />
        ))}

        {[0, 1].map((i) => (
          <g key={i}>
            <rect
              x={APP_X + 68 + i * 112}
              y={APP_Y + 46}
              width={100}
              height={46}
              rx={9}
              fill="rgba(16,19,34,0.035)"
              stroke="rgba(16,19,34,0.07)"
              strokeWidth={1}
            />
            <rect
              x={APP_X + 80 + i * 112}
              y={APP_Y + 58}
              width={18}
              height={4}
              rx={2}
              fill={i === 0 ? '#005be3' : '#9a51ff'}
            />
            <rect
              x={APP_X + 80 + i * 112}
              y={APP_Y + 70}
              width={54 - i * 12}
              height={7}
              rx={3.5}
              fill="rgba(16,19,34,0.22)"
            />
          </g>
        ))}

        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={APP_X + 80} cy={APP_Y + 122 + i * 27} r={7} fill="rgba(0,91,227,0.15)" />
            <rect
              x={APP_X + 96}
              y={APP_Y + 118 + i * 27}
              width={78 - (i % 3) * 14}
              height={7}
              rx={3.5}
              fill="rgba(16,19,34,0.2)"
            />
            <rect
              x={APP_X + APP_W - 62}
              y={APP_Y + 117 + i * 27}
              width={40}
              height={11}
              rx={5.5}
              fill="rgba(0,91,227,0.1)"
              stroke="rgba(0,91,227,0.2)"
              strokeWidth={0.8}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
