import type React from 'react';

/*
 * SaaS hero artifact — attack surface, shown as size.
 *
 * The same container image twice, on one baseline at one scale: the public base
 * image on the left, the CleanStart rebuild of it on the right. The right stack
 * is a fraction of the height, and the packages that were stripped out drift
 * away above the left one, so the picture reads as SUBTRACTION rather than as
 * two unrelated objects.
 *
 * Why this and not the alternatives that were tried:
 *
 *  - It is ONE idea, legible in about a second. Big versus small. Every earlier
 *    attempt (a hexagon lattice, a component constellation, a catalogue panel, a
 *    cutaway spec with eight simultaneous ideas) needed decoding, and a hero
 *    sitting beside a large headline does not get decoded.
 *  - Contrast comes for free. The bright minimal object against the dark hero is
 *    the natural composition, where a dark cross-section on the navy mesh would
 *    have to fight the background.
 *  - It is the actual product claim and it is provable: hardened, minimal, fewer
 *    packages, smaller attack surface. images.cleanstart.com publishes 34%+
 *    average CVE reduction across 33,357+ remediated CVEs.
 *  - It collides with nothing on the site. There is no sequence, so it cannot be
 *    confused with the Code/Build/Test/Deploy section below; there is no
 *    inspection, magnifier or shield, so it does not echo the financial services
 *    hero, which is about scrutiny where this is about removal.
 *
 * SaaS stays a light touch, deliberately. The finance sibling is only "finance"
 * through a small bank glyph in its backdrop; the container is the subject
 * there too. Trying to make the artifact itself say "SaaS" is what produced the
 * rejected dashboards. The H1 and the copy carry that.
 *
 * No numbers are drawn on it. A figure next to two stacks invites the reader to
 * read the height difference as that ratio, and it is an illustration, not a
 * chart.
 */

const VIEW_W = 520;
const BASELINE = 322;
const STACK_W = 176;
const LEFT_X = 56;
const RIGHT_X = 288;
const BAND_GAP = 5;

const LEFT_BANDS = [34, 28, 32, 26, 30, 34, 28] as const;
const RIGHT_BANDS = [28, 22, 26] as const;

/*
 * Deterministic, not Math.random: the package layout must be identical on the
 * server and the client or React throws a hydration mismatch.
 */
function rnd(i: number): number {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  x = (x ^ (x >>> 13)) >>> 0;
  return x / 4294967296;
}

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/*
 * Two package treatments, because size alone was not doing enough work. The
 * public image gets jittered heights and baselines so it reads as unruly; the
 * rebuild gets three identical blocks on one line so it reads as governed. Order
 * versus disorder carries the idea even before the height difference registers.
 */
function densePackages(stackX: number, y: number, height: number, seed: number): readonly Rect[] {
  const maxX = stackX + STACK_W - 9;
  const out: Rect[] = [];
  let cx = stackX + 9;
  let i = 0;

  while (cx < maxX && i < 24) {
    const w = Math.min(8 + Math.floor(rnd(seed + i) * 16), maxX - cx);
    if (w < 6) break;
    const shrink = Math.floor(rnd(seed + i + 500) * 5);
    const drop = Math.floor(rnd(seed + i + 900) * 3);
    out.push({ x: cx, y: y + drop, w, h: Math.max(4, height - shrink) });
    cx += w + 4;
    i += 1;
  }
  return out;
}

function sparsePackages(stackX: number, y: number, height: number): readonly Rect[] {
  const count = 3;
  const gap = 14;
  const usable = STACK_W - 18 - gap * (count - 1);
  const w = usable / count;
  return Array.from({ length: count }, (_, i) => ({
    x: stackX + 9 + i * (w + gap),
    y,
    w,
    h: height,
  }));
}

interface Band {
  readonly y: number;
  readonly h: number;
  readonly packages: readonly Rect[];
}

function buildStack(stackX: number, heights: readonly number[], dense: boolean): readonly Band[] {
  const bands: Band[] = [];
  let bottom = BASELINE;

  heights.forEach((h, i) => {
    const y = bottom - h;
    bands.push({
      y,
      h,
      packages: dense
        ? densePackages(stackX, y + 6, h - 12, i * 97 + 11)
        : sparsePackages(stackX, y + 7, h - 14),
    });
    bottom = y - BAND_GAP;
  });

  return bands;
}

const LEFT_STACK = buildStack(LEFT_X, LEFT_BANDS, true);
const RIGHT_STACK = buildStack(RIGHT_X, RIGHT_BANDS, false);

/*
 * Three, muted, and round. The financial services page's risk-chain section
 * already signals vulnerabilities with red and amber triangles; the two industry
 * pages should not trade the same mark.
 */
const CVE_MARKS: readonly { x: number; y: number; fill: string }[] = [
  { x: 104, y: 303, fill: 'rgba(255,107,90,0.75)' },
  { x: 188, y: 241, fill: 'rgba(255,176,32,0.66)' },
  { x: 130, y: 148, fill: 'rgba(255,107,90,0.58)' },
];

/** Stripped packages leaving the public image: removal made visible. */
const FRAGMENTS: readonly (Rect & { o: number; r: number })[] = [
  { x: 241, y: 168, w: 22, h: 8, o: 0.32, r: -12 },
  { x: 268, y: 140, w: 17, h: 8, o: 0.27, r: 9 },
  { x: 247, y: 112, w: 24, h: 7, o: 0.21, r: -6 },
  { x: 281, y: 88, w: 14, h: 7, o: 0.16, r: 14 },
  { x: 258, y: 62, w: 19, h: 6, o: 0.11, r: -9 },
  { x: 292, y: 42, w: 11, h: 6, o: 0.07, r: 6 },
];

function Label({ x, text, bright }: { x: number; text: string; bright: boolean }) {
  return (
    <text
      x={x + STACK_W / 2}
      y={352}
      textAnchor="middle"
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.13em',
        fill: bright ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.34)',
      }}
    >
      {text}
    </text>
  );
}

export function SaasHeroAttackSurface(): React.ReactElement {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} 400`}
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      className="block w-full"
    >
      <defs>
        <linearGradient id="saas-hardened-band" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3aa7ff" />
          <stop offset="100%" stopColor="#0a5fe0" />
        </linearGradient>
        <radialGradient id="saas-hardened-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#239cff" stopOpacity="0.42" />
          <stop offset="60%" stopColor="#5b6bff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Shared baseline. Without it the two stacks float and the height
          comparison stops being a comparison. */}
      <line
        x1={LEFT_X - 10}
        y1={BASELINE + 8}
        x2={RIGHT_X + STACK_W + 10}
        y2={BASELINE + 8}
        stroke="rgba(255,255,255,0.11)"
        strokeWidth={1}
      />

      <g className="cs-hero-fade" style={{ animationDelay: '520ms' }}>
        {FRAGMENTS.map((f) => (
          <rect
            key={`${f.x}-${f.y}`}
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx={2}
            fill={`rgba(255,255,255,${f.o})`}
            transform={`rotate(${f.r} ${f.x + f.w / 2} ${f.y + f.h / 2})`}
          />
        ))}
      </g>

      {/* Public base image: dimmed, dense, carrying the CVEs. */}
      {LEFT_STACK.map((band, i) => (
        <g
          key={`l-${band.y}`}
          className="cs-hero-band"
          style={{ animationDelay: `${140 + i * 55}ms` }}
        >
          <rect
            x={LEFT_X}
            y={band.y}
            width={STACK_W}
            height={band.h}
            rx={5}
            fill="rgba(255,255,255,0.045)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
          {band.packages.map((p) => (
            <rect
              key={`${p.x}-${p.y}`}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={2}
              fill="rgba(255,255,255,0.15)"
            />
          ))}
        </g>
      ))}

      <g className="cs-hero-fade" style={{ animationDelay: '460ms' }}>
        {CVE_MARKS.map((c) => (
          <circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={4.5} fill={c.fill} />
        ))}
      </g>

      {/* CleanStart rebuild: fewer layers, sparse packages, full saturation. It
          is smaller than the image beside it and still the brightest thing in
          the frame, which is the whole argument. */}
      <ellipse
        cx={RIGHT_X + STACK_W / 2}
        cy={BASELINE - 40}
        rx={168}
        ry={132}
        fill="url(#saas-hardened-glow)"
      />

      {RIGHT_STACK.map((band, i) => (
        <g
          key={`r-${band.y}`}
          className="cs-hero-band"
          style={{ animationDelay: `${300 + i * 70}ms` }}
        >
          <rect
            x={RIGHT_X}
            y={band.y}
            width={STACK_W}
            height={band.h}
            rx={5}
            fill="url(#saas-hardened-band)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
          />
          {band.packages.map((p) => (
            <rect
              key={`${p.x}-${p.y}`}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={2}
              fill="rgba(255,255,255,0.5)"
            />
          ))}
        </g>
      ))}

      <g className="cs-hero-fade" style={{ animationDelay: '560ms' }}>
        <Label x={LEFT_X} text="PUBLIC BASE IMAGE" bright={false} />
        <Label x={RIGHT_X} text="CLEANSTART" bright />
      </g>
    </svg>
  );
}
