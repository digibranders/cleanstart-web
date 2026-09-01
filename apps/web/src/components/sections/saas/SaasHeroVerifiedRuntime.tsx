import type React from 'react';

/*
 * SaaS hero artifact — a SaaS application, and the verified container image it
 * runs on.
 *
 * Both halves of the H1 have to be visible at once. Earlier attempts each showed
 * only one: the catalogue panel and the product dashboard were SaaS with no
 * container, and the two-stack attack-surface comparison was containers with no
 * SaaS (and its flat bands did not read as container images either — they read
 * as generic block grids).
 *
 * Composition, and the order matters:
 *
 *   - The CONTAINER IMAGE is the subject: the largest object, isometric so it
 *     reads as a physical thing rather than a diagram, and built as a STACK OF
 *     LAYERS rather than one solid box. A single box read as a plinth, which is
 *     the "app on a platform" idea that was already rejected once; discrete
 *     layers are what make it an image instead of a slab.
 *   - The SaaS APPLICATION is the context, seated just above the top layer so it
 *     is plainly running ON the image.
 *
 * The app window says SaaS through tenant rows, avatars and status pills. No
 * charts: a rising line on this page promises revenue growth, which is what got
 * the original render rejected.
 *
 * No caption. One read "VERIFIED CONTAINER IMAGE" and landed 60px inside the
 * hero's white bottom fade, where 55%-white type is invisible — and the artifact
 * is taller than the dark band above that fade, so it could not simply be moved
 * up. The object carries itself: layered isometric stack, verified seal, under a
 * headline that already says Container Security.
 *
 * Same formula as the approved financial services hero (industry surface as
 * context, container as subject), which is right for a page family. What differs
 * is the industry signal and the composition: that one magnifies a container
 * inside a finance console, this one seats an app on top of an image.
 */

const VIEW_W = 520;
const VIEW_H = 392;

/* Points, not tuples: `noUncheckedIndexedAccess` makes every array index
   `number | undefined`, which is noise for fixed geometry like this. */
interface Point {
  readonly x: number;
  readonly y: number;
}

const CX = 262;
const HALF_W = 132;
const HALF_D = 35;
const THICK = 26;

/** Top to bottom. Centres 32 apart against a 26 thickness leaves a 6px reveal
    between layers, which is what stops the stack reading as one solid box. */
const LAYER_Y = [246, 278, 310] as const;

const APP_X = 152;
const APP_Y = 58;
const APP_W = 232;
const APP_H = 132;

interface TenantRow {
  readonly y: number;
  readonly nameW: number;
  readonly pillW: number;
}

const TENANTS: readonly TenantRow[] = [
  { y: 100, nameW: 62, pillW: 34 },
  { y: 124, nameW: 48, pillW: 28 },
  { y: 148, nameW: 70, pillW: 34 },
  { y: 172, nameW: 54, pillW: 26 },
];

function poly(...points: readonly Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function Layer({ cy, top }: { cy: number; top: boolean }): React.ReactElement {
  const t: Point = { x: CX, y: cy - HALF_D };
  const r: Point = { x: CX + HALF_W, y: cy };
  const b: Point = { x: CX, y: cy + HALF_D };
  const l: Point = { x: CX - HALF_W, y: cy };
  const drop = (p: Point): Point => ({ x: p.x, y: p.y + THICK });

  return (
    <g>
      <polygon
        points={poly(t, r, b, l)}
        fill="url(#csr-top)"
        stroke="rgba(255,255,255,0.26)"
        strokeWidth={1.2}
      />
      <polygon
        points={poly(l, b, drop(b), drop(l))}
        fill="url(#csr-left)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1.2}
      />
      <polygon
        points={poly(b, r, drop(r), drop(b))}
        fill="url(#csr-right)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1.2}
      />
      {/* Bright leading edges catch the light and separate one layer from the
          next; without them the stack flattens into a single mass. */}
      <line
        x1={l.x}
        y1={l.y}
        x2={b.x}
        y2={b.y}
        stroke={top ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.32)'}
        strokeWidth={1.2}
      />
      <line
        x1={b.x}
        y1={b.y}
        x2={r.x}
        y2={r.y}
        stroke={top ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.32)'}
        strokeWidth={1.2}
      />
    </g>
  );
}

export function SaasHeroVerifiedRuntime(): React.ReactElement {
  const topLayerY = LAYER_Y[0];
  const bottomLayerY = LAYER_Y[LAYER_Y.length - 1] ?? 310;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      className="block w-full"
    >
      <defs>
        <linearGradient id="csr-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#57b4ff" />
          <stop offset="100%" stopColor="#2b7fe8" />
        </linearGradient>
        <linearGradient id="csr-left" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2266d8" />
          <stop offset="100%" stopColor="#123f95" />
        </linearGradient>
        <linearGradient id="csr-right" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3489f2" />
          <stop offset="100%" stopColor="#1a58bf" />
        </linearGradient>
        <linearGradient id="csr-seal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b47cff" />
          <stop offset="100%" stopColor="#7c34e8" />
        </linearGradient>
        <radialGradient id="csr-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#239cff" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#5b6bff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
        </radialGradient>
        {/* Soft-edged, not a flat ellipse. A hard dark ellipse on the top face
            read as a hole punched in it rather than as a shadow. */}
        <radialGradient id="csr-contact" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#03081e" stopOpacity="0.42" />
          <stop offset="65%" stopColor="#03081e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#03081e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={CX} cy={282} rx={232} ry={178} fill="url(#csr-glow)" />

      {/* Drawn bottom layer first so each upper layer occludes the one beneath,
          which is what gives the stack its depth order. */}
      <g className="cs-hero-band" style={{ animationDelay: '120ms' }}>
        {[...LAYER_Y].reverse().map((cy) => (
          <Layer key={cy} cy={cy} top={cy === topLayerY} />
        ))}

        {/* Verified seal, straddling the stack's front corner so it reads as
            applied to the whole image rather than to one layer. */}
        <g transform={`translate(${CX} ${bottomLayerY + HALF_D + 4})`}>
          <circle r={21} fill="url(#csr-seal)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.8} />
          <path
            d="M-9,1 L-2.5,8 L10,-7"
            fill="none"
            stroke="#ffffff"
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      <ellipse
        cx={CX}
        cy={(topLayerY ?? 246) - HALF_D + 16}
        rx={104}
        ry={22}
        fill="url(#csr-contact)"
      />

      {/* SaaS application — the context. Tenants, not charts. */}
      <g className="cs-hero-band" style={{ animationDelay: '300ms' }}>
        <rect
          x={APP_X}
          y={APP_Y}
          width={APP_W}
          height={APP_H}
          rx={12}
          fill="#f6f8fe"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
        <line
          x1={APP_X}
          y1={APP_Y + 26}
          x2={APP_X + APP_W}
          y2={APP_Y + 26}
          stroke="rgba(16,19,34,0.09)"
          strokeWidth={1}
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={APP_X + 16 + i * 11}
            cy={APP_Y + 13}
            r={3}
            fill="rgba(16,19,34,0.16)"
          />
        ))}
        <rect
          x={APP_X + APP_W - 58}
          y={APP_Y + 8}
          width={44}
          height={10}
          rx={5}
          fill="rgba(16,19,34,0.06)"
        />

        {TENANTS.map((row) => (
          <g key={row.y}>
            <circle cx={APP_X + 22} cy={row.y} r={7} fill="rgba(0,91,227,0.16)" />
            <rect
              x={APP_X + 36}
              y={row.y - 4}
              width={row.nameW}
              height={7}
              rx={3.5}
              fill="rgba(16,19,34,0.2)"
            />
            <rect
              x={APP_X + APP_W - row.pillW - 16}
              y={row.y - 5}
              width={row.pillW}
              height={10}
              rx={5}
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
