import { ClipboardCheck, Radar, RefreshCw, ShieldAlert } from 'lucide-react';

import { Reveal } from '@/components/ui/Reveal';

/** Minimal structural type for the lucide glyphs we render. */
type IconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
}>;

type LoopNode = {
  title: string;
  body: string;
  /** Position on the loop, in screen-space degrees (-90 = top, 0 = right, 90 = bottom). */
  angle: number;
  /** Disc gradient: from → to. `from` is also the outgoing connector's colour. */
  from: string;
  to: string;
  Icon: IconComponent;
};

/* Clockwise from the top: Discover → Inventory → Remediate → Analyse → repeat. */
const NODES: readonly [LoopNode, LoopNode, LoopNode, LoopNode] = [
  {
    title: 'Continuous Discovery',
    body: 'Discover software assets across modern environments.',
    angle: -90,
    from: '#1E6FE8',
    to: '#4B92F5',
    Icon: Radar,
  },
  {
    title: 'Verified Inventories',
    body: 'Maintain verified inventories, SBOMs, and provenance.',
    angle: 0,
    from: '#14A18E',
    to: '#1FC0A6',
    Icon: ClipboardCheck,
  },
  {
    title: 'Verified Remediation',
    body: 'Prioritize remediation with verified alternatives.',
    angle: 90,
    from: '#7C5CF7',
    to: '#9A7CFF',
    Icon: RefreshCw,
  },
  {
    title: 'Inherited Risk Analysis',
    body: 'Correlate inherited software risk across environments.',
    angle: 180,
    from: '#F43F5E',
    to: '#FB7185',
    Icon: ShieldAlert,
  },
];

/* Diagram geometry, in a 400×400 user-space box. */
const SIZE = 400;
const C = SIZE / 2;
const R_NODE = 150; // radius the disc centres sit on
const R_ARC = 150; // arcs ride the same circle, so the four hops trace one true ring
const INSET = 24; // degrees trimmed off each end to clear the disc and leave a gap

const rad = (deg: number): number => (deg * Math.PI) / 180;
const point = (deg: number, r: number): { x: number; y: number } => ({
  x: C + r * Math.cos(rad(deg)),
  y: C + r * Math.sin(rad(deg)),
});

type Connector = { id: string; d: string; arrow: string; color: string };

/* One quarter-circle arrow per clockwise hop, riding the disc ring so the four
   together trace a single circle. The discs sit ON the ring (arcs touch each at
   its tangent points), which keeps the radial label directions free. Coloured by
   origin node; the arrowhead points clockwise along the ring into the next disc. */
const LOOP_SEGMENTS: readonly { fromAngle: number; toAngle: number; color: string }[] = [
  { fromAngle: -90, toAngle: 0, color: NODES[0].from },
  { fromAngle: 0, toAngle: 90, color: NODES[1].from },
  { fromAngle: 90, toAngle: 180, color: NODES[2].from },
  { fromAngle: 180, toAngle: 270, color: NODES[3].from },
];

const CONNECTORS: readonly Connector[] = LOOP_SEGMENTS.map((seg, i) => {
  const aStart = seg.fromAngle + INSET;
  const aEnd = seg.toAngle - INSET;
  const start = point(aStart, R_ARC);
  const end = point(aEnd, R_ARC);

  // Clockwise tangent (heading) and outward radial (perp) at the arc's end.
  const hx = -Math.sin(rad(aEnd));
  const hy = Math.cos(rad(aEnd));
  const rx = Math.cos(rad(aEnd));
  const ry = Math.sin(rad(aEnd));
  const tip = { x: end.x + hx * 1.5, y: end.y + hy * 1.5 };
  const back = { x: end.x - hx * 9, y: end.y - hy * 9 };
  const left = { x: back.x + rx * 5, y: back.y + ry * 5 };
  const right = { x: back.x - rx * 5, y: back.y - ry * 5 };

  return {
    id: `posture-arc-${i}`,
    d: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R_ARC} ${R_ARC} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    arrow: `M ${tip.x.toFixed(2)} ${tip.y.toFixed(2)} L ${left.x.toFixed(2)} ${left.y.toFixed(2)} L ${right.x.toFixed(2)} ${right.y.toFixed(2)} Z`,
    color: seg.color,
  };
});

/** Premium ring-icon disc: a glossy "sphere" (off-centre radial highlight) inside
    a soft frosted halo. Shared by the loop diagram and the mobile stepper. */
function NodeBadge({ node, size }: { node: LoopNode; size: number }): React.ReactElement {
  const { Icon } = node;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Frosted halo — a larger, softly tinted ring sitting behind the disc. */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          transform: 'scale(1.34)',
          background: `radial-gradient(circle, ${node.from}24 0%, ${node.from}0D 55%, transparent 72%)`,
        }}
      />
      {/* The disc — spherical light source top-left, glossy top, soft inner depth. */}
      <span
        className="relative flex h-full w-full items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(130% 130% at 32% 24%, ${node.to} 0%, ${node.from} 70%)`,
          boxShadow: [
            `0 0 0 1.25px ${node.from}33`,
            `0 0 0 7px ${node.from}14`,
            `0 16px 30px -12px ${node.from}99`,
            'inset 0 2px 3px rgba(255,255,255,0.4)',
            'inset 0 -5px 9px rgba(0,0,0,0.12)',
          ].join(', '),
        }}
      >
        <Icon
          size={Math.round(size * 0.44)}
          strokeWidth={1.75}
          className="text-white"
          aria-hidden
        />
      </span>
    </div>
  );
}

export function CleanSightUnified(): React.ReactElement {
  return (
    <section
      data-section="CleanSightUnified"
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 90% at 85% 10%, rgba(124,92,247,0.06) 0%, transparent 55%), radial-gradient(110% 80% at 8% 90%, rgba(30,111,232,0.06) 0%, transparent 50%), #ffffff',
      }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-12 lg:gap-16">
          {/* ── Left: copy ───────────────────────────────────────────── */}
          <div className="max-w-[560px]">
            <Reveal header>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h2)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  color: '#111',
                }}
              >
                Software Supply Chain{' '}
                <span className="cs-text-gradient-impact">Posture Management</span>
              </h2>
            </Reveal>

            <Reveal header delay={0.16} y={20}>
              <div
                aria-hidden
                className="mt-6 h-[3px] w-40 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #2CC1EB 0%, #9A51FF 100%)',
                }}
              />
            </Reveal>

            <Reveal header delay={0.22} y={20}>
              <p
                className="mt-6"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-lead)',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.5,
                  color: '#3f3f46',
                }}
              >
                Continuously discover software assets, correlate inherited software risk, maintain
                verified inventories, and accelerate remediation with verified software
                alternatives.
              </p>
            </Reveal>
          </div>

          {/* ── Right: continuous-loop diagram (tablet / desktop) ────── */}
          {/* `pb` reserves room for the bottom disc's label so it stays inside the
              diagram box instead of spilling into the section's bottom padding —
              which is what made the loop sit too high. `pt-2` evens the top. */}
          <Reveal
            delay={0.1}
            className="relative mx-auto hidden w-full max-w-[680px] pt-2 pb-[132px] sm:block"
          >
            {/* The ring lives in a centred square; the wider wrapper leaves side
                margins so the left/right labels can sit OUTSIDE the circle, clear
                of the arrows. */}
            <div className="relative mx-auto aspect-square w-full max-w-[408px]">
              {/* Connector layer. */}
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="absolute inset-0 h-full w-full overflow-visible"
                fill="none"
                aria-hidden
              >
                {CONNECTORS.map((c) => (
                  <g key={c.id}>
                    <path
                      className="cs-posture-flow"
                      d={c.d}
                      stroke={c.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeDasharray="0.5 7.5"
                      fill="none"
                    />
                    <path d={c.arrow} fill={c.color} />
                  </g>
                ))}
              </svg>

              {/* Nodes. The disc is centred exactly on the loop point. Top and
                  bottom labels hang below their disc; the left/right labels sit
                  OUTSIDE the ring (in the wrapper's side margins) so the vertical
                  arcs never run through them. */}
              {NODES.map((node) => {
                const p = point(node.angle, R_NODE);
                const placement =
                  node.angle === 0 ? 'right' : node.angle === 180 ? 'left' : 'below';
                const labelClass =
                  placement === 'right'
                    ? 'absolute left-full top-1/2 -translate-y-1/2 pl-3 text-left'
                    : placement === 'left'
                      ? 'absolute right-full top-1/2 -translate-y-1/2 pr-3 text-right'
                      : 'absolute left-1/2 top-full -translate-x-1/2 pt-3.5 text-center';
                return (
                  <div
                    key={node.title}
                    className="absolute"
                    style={{
                      left: `${(p.x / SIZE) * 100}%`,
                      top: `${(p.y / SIZE) * 100}%`,
                      width: 76,
                      height: 76,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <NodeBadge node={node} size={76} />
                    <div
                      className={labelClass}
                      style={{ width: placement === 'below' ? 168 : 120 }}
                    >
                      <p
                        className="font-display font-semibold"
                        style={{
                          fontSize: '17px',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.2,
                          color: '#111',
                        }}
                      >
                        {node.title}
                      </p>
                      <p
                        className="mt-1.5"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '13.5px',
                          lineHeight: 1.45,
                          color: '#52525b',
                        }}
                      >
                        {node.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* ── Right: vertical stepper (mobile) ─────────────────────── */}
          <div className="relative sm:hidden">
            {/* Rail behind the discs — centred on the 56 px badge (28 px from left). */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-7 left-[28px] top-7 w-[2px] rounded-full"
              style={{
                background:
                  'linear-gradient(180deg, #1E6FE8 0%, #14A18E 33%, #7C5CF7 66%, #F43F5E 100%)',
                opacity: 0.5,
              }}
            />
            <ul className="flex flex-col gap-8">
              {NODES.map((node) => (
                <li key={node.title} className="relative flex items-start gap-5">
                  <NodeBadge node={node} size={56} />
                  <div className="pt-1.5">
                    <p
                      className="font-display font-semibold"
                      style={{
                        fontSize: '16px',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                        color: '#111',
                      }}
                    >
                      {node.title}
                    </p>
                    <p
                      className="mt-1"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        lineHeight: 1.45,
                        color: '#52525b',
                      }}
                    >
                      {node.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
