import type React from 'react';

/*
 * SaaS hero artifact — a SaaS application, and the verified container image it
 * runs on.
 *
 * Both halves of the H1 have to be visible at once. Earlier attempts each showed
 * only one: the catalogue panel and the product dashboard were SaaS with no
 * container, and the attack-surface comparison was containers with no SaaS (and
 * its flat bands read as generic block grids rather than as images).
 *
 * Composition, and the order matters:
 *
 *   - The CONTAINER IMAGE is the subject: largest object, isometric so it reads
 *     as a physical thing rather than a diagram, and built as a STACK OF LAYERS
 *     rather than one solid box. A single box read as a plinth, which is the
 *     "app on a platform" idea already rejected once; discrete layers are what
 *     make it an image instead of a slab.
 *   - The SaaS APPLICATION is the context, seated just above the top layer so it
 *     is plainly running ON the image. It says SaaS through tenant rows,
 *     avatars and status pills — never charts, since a rising line on this page
 *     promises revenue growth, which is what got the original render rejected.
 *   - Two dim SATELLITE stacks and a dot field fill the frame. The main subject
 *     previously occupied 264px of a 520px viewBox, so the artifact was mostly
 *     padding, which read as a hole between the headline and the illustration.
 *     The satellites also carry a real idea: this is one image out of a
 *     catalogue, not a single artifact.
 *
 * No caption. One read "VERIFIED CONTAINER IMAGE" and landed inside the hero's
 * white bottom fade, where 55%-white type is invisible. The object carries
 * itself under a headline that already says Container Security.
 *
 * Same formula as the approved financial services hero (industry surface as
 * context, container as subject), which is right for a page family. What differs
 * is the industry signal and the composition: that one magnifies a container
 * inside a finance console, this one seats an app on top of an image.
 */

const VIEW_W = 520;
const VIEW_H = 392;

interface Point {
  readonly x: number;
  readonly y: number;
}

const CX = 268;
const HALF_W = 166;
const HALF_D = 44;
const THICK = 28;

/** Top to bottom. Centres 34 apart against a 28 thickness leaves a 6px reveal
    between layers, which is what stops the stack reading as one solid box. */
const LAYER_Y = [242, 276, 310] as const;

const APP_X = 146;
const APP_Y = 44;
const APP_W = 250;
const APP_H = 140;

interface TenantRow {
  readonly y: number;
  readonly nameW: number;
  readonly pillW: number;
}

const TENANTS: readonly TenantRow[] = [
  { y: 90, nameW: 68, pillW: 36 },
  { y: 114, nameW: 52, pillW: 28 },
  { y: 138, nameW: 76, pillW: 36 },
  { y: 162, nameW: 58, pillW: 26 },
];

function poly(...points: readonly Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

interface SlabProps {
  readonly cx: number;
  readonly cy: number;
  readonly halfW: number;
  readonly halfD: number;
  readonly thick: number;
  readonly edge: string;
}

function Slab({ cx, cy, halfW, halfD, thick, edge }: SlabProps): React.ReactElement {
  const t: Point = { x: cx, y: cy - halfD };
  const r: Point = { x: cx + halfW, y: cy };
  const b: Point = { x: cx, y: cy + halfD };
  const l: Point = { x: cx - halfW, y: cy };
  const drop = (p: Point): Point => ({ x: p.x, y: p.y + thick });

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
      {/* Leading edges catch the light and separate one layer from the next;
          without them the stack flattens into a single mass. */}
      <line x1={l.x} y1={l.y} x2={b.x} y2={b.y} stroke={edge} strokeWidth={1.2} />
      <line x1={b.x} y1={b.y} x2={r.x} y2={r.y} stroke={edge} strokeWidth={1.2} />
    </g>
  );
}

/** A dim two-layer stack: one more image in the catalogue, and frame ballast. */
function Satellite({ cx, cy, scale }: { cx: number; cy: number; scale: number }) {
  const halfW = 46 * scale;
  const halfD = 13 * scale;
  const thick = 11 * scale;
  return (
    <>
      {[cy + 16 * scale, cy].map((y) => (
        <Slab
          key={y}
          cx={cx}
          cy={y}
          halfW={halfW}
          halfD={halfD}
          thick={thick}
          edge="rgba(255,255,255,0.26)"
        />
      ))}
    </>
  );
}

/** Deterministic is not needed here — the grid is a fixed lattice. */
function DotField(): React.ReactElement {
  const dots: React.ReactElement[] = [];
  for (let x = 24; x <= VIEW_W - 16; x += 30) {
    for (let y = 28; y <= VIEW_H - 24; y += 30) {
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="rgba(255,255,255,0.055)" />);
    }
  }
  return <g>{dots}</g>;
}

export function SaasHeroVerifiedRuntime(): React.ReactElement {
  const topLayerY = LAYER_Y[0] ?? 242;
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
          <stop offset="0%" stopColor="#239cff" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#5b6bff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
        </radialGradient>
        {/* Soft-edged, not a flat ellipse. A hard dark ellipse on the top face
            read as a hole punched in it rather than as a shadow. */}
        <radialGradient id="csr-contact" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#03081e" stopOpacity="0.42" />
          <stop offset="65%" stopColor="#03081e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#03081e" stopOpacity="0" />
        </radialGradient>
        {/* Fades the dot field out at the frame edges so it stops rather than
            being sliced off by the viewBox. */}
        <radialGradient id="csr-field-mask" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="62%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id="csr-field">
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#csr-field-mask)" />
        </mask>
      </defs>

      <g mask="url(#csr-field)">
        <DotField />
      </g>

      <ellipse cx={CX} cy={274} rx={244} ry={186} fill="url(#csr-glow)" />

      {/* Satellites sit behind and outside the subject, dimmed well back so they
          read as depth rather than as three competing objects. */}
      <g className="cs-hero-fade" opacity={0.3} style={{ animationDelay: '420ms' }}>
        <Satellite cx={58} cy={286} scale={1} />
      </g>
      <g className="cs-hero-fade" opacity={0.24} style={{ animationDelay: '480ms' }}>
        <Satellite cx={470} cy={232} scale={0.86} />
      </g>

      {/* Bottom layer drawn first so each upper layer occludes the one beneath,
          which is what gives the stack its depth order. */}
      <g className="cs-hero-band" style={{ animationDelay: '120ms' }}>
        {[...LAYER_Y].reverse().map((cy) => (
          <Slab
            key={cy}
            cx={CX}
            cy={cy}
            halfW={HALF_W}
            halfD={HALF_D}
            thick={THICK}
            edge={cy === topLayerY ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.32)'}
          />
        ))}

        {/* Verified seal, straddling the stack's front corner so it reads as
            applied to the whole image rather than to one layer. */}
        <g transform={`translate(${CX} ${bottomLayerY + HALF_D + 6})`}>
          <circle r={22} fill="url(#csr-seal)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.8} />
          <path
            d="M-9.5,1 L-2.5,8.5 L10.5,-7"
            fill="none"
            stroke="#ffffff"
            strokeWidth={3.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      <ellipse cx={CX} cy={topLayerY - HALF_D + 18} rx={112} ry={24} fill="url(#csr-contact)" />

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
          x={APP_X + APP_W - 60}
          y={APP_Y + 8}
          width={46}
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
