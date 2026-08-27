import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

/*
 * "Move Beyond Shift Left" — the page's argument, built as a gate comparison.
 *
 * The proposal hands this section two arrow chains and nothing else:
 *
 *     Code → Build → Test → Deploy → Security Review
 *     Verified Components → Code → Build → Test → Deploy → Security Review
 *
 * The first attempt at this rendered them literally: two rows of labelled boxes
 * with a dot travelling under each. It was legible and it was worthless — a
 * wireframe. Twelve identical rectangles carry no craft, and worse, the two
 * chains looked equally successful. The reader had to be *told* which one was
 * the good one.
 *
 * The fix is that the two paths differ in SHAPE, not just in contents:
 *
 *   - The unverified track ends at a gate whose barrier is DOWN. Findings pile
 *     onto each stage as the artifact passes, the gate refuses it, and a return
 *     arc sweeps back over the top to Code. It is a closed loop. It never ships.
 *   - The verified track starts at a source block, runs the same stages clean,
 *     and its gate barrier is UP. The artifact passes through and exits right.
 *     It is a straight line with an exit.
 *
 * A loop and a line. That reads in half a second with the animation paused,
 * which is the test a diagram has to pass — the motion should reward attention,
 * not be required for comprehension.
 *
 * Geometry lives in one SVG per track on a shared 1200-unit viewBox, so the
 * rail, the nodes, the gate and the return arc are all in one coordinate system
 * and cannot drift apart. Stage labels are HTML underneath on a six-column grid
 * whose centres match the SVG node centres — SVG text would scale with the
 * viewBox and fall under the type floor at narrow desktop widths.
 *
 * Timing is pure CSS on a shared cycle, generated from the stop table rather
 * than hand-written. Both artifacts, the findings, the gate flash and the arc
 * pulse read from the same clock, so a comparison cannot fall out of sync.
 *
 * Copy is the proposal's, verbatim. Neither track carries a label: the proposal
 * names them nothing, and "Traditional" versus "With CleanStart" would be the
 * page putting words in the client's mouth. The gates do the work instead.
 */

const CYCLE_MS = 8600;
const COLUMNS = 6;
const VIEW_W = 1200;

/** Column centre in viewBox units. Matches the HTML label grid exactly. */
function columnX(index: number): number {
  return ((index + 0.5) / COLUMNS) * VIEW_W;
}

const STAGES_A = ['Code', 'Build', 'Test', 'Deploy', 'Security Review'] as const;
const STAGES_B = [
  'Verified Components',
  'Code',
  'Build',
  'Test',
  'Deploy',
  'Security Review',
] as const;

/** Stage columns that raise a finding, paired with the cycle % the artifact lands. */
const FINDINGS: readonly { column: number; at: number }[] = [
  { column: 2, at: 15 },
  { column: 3, at: 29 },
  { column: 4, at: 43 },
];

/* Cycle landmarks, shared by every animation below. */
const A_AT_GATE = 57;
const A_REJECTED = 59;
const A_RETURNS = 70;
const A_RESET = 88;
const B_AT_GATE = 67;
const B_EXITS = 80;

const RAIL_A_Y = 140;
const RAIL_B_Y = 62;

export function SaasShiftLeft(): React.ReactElement {
  const css = `
    @keyframes csArtifactA {
      0%, 8%    { transform: translate(${columnX(1)}px, ${RAIL_A_Y}px); opacity: 1; }
      15%, 22%  { transform: translate(${columnX(2)}px, ${RAIL_A_Y}px); opacity: 1; }
      29%, 36%  { transform: translate(${columnX(3)}px, ${RAIL_A_Y}px); opacity: 1; }
      43%, 50%  { transform: translate(${columnX(4)}px, ${RAIL_A_Y}px); opacity: 1; }
      ${A_AT_GATE}%, ${A_RETURNS - 4}% { transform: translate(${columnX(5) - 44}px, ${RAIL_A_Y}px); opacity: 1; }
      ${A_RETURNS}%, ${A_RESET - 1}% { transform: translate(${columnX(5) - 44}px, ${RAIL_A_Y}px); opacity: 0; }
      ${A_RESET}%, 100% { transform: translate(${columnX(1)}px, ${RAIL_A_Y}px); opacity: 1; }
    }
    @keyframes csArtifactB {
      0%, 8%    { transform: translate(${columnX(0)}px, ${RAIL_B_Y}px); opacity: 1; }
      15%, 22%  { transform: translate(${columnX(1)}px, ${RAIL_B_Y}px); opacity: 1; }
      29%, 36%  { transform: translate(${columnX(2)}px, ${RAIL_B_Y}px); opacity: 1; }
      43%, 50%  { transform: translate(${columnX(3)}px, ${RAIL_B_Y}px); opacity: 1; }
      57%, 62%  { transform: translate(${columnX(4)}px, ${RAIL_B_Y}px); opacity: 1; }
      ${B_AT_GATE}%, ${B_EXITS - 4}% { transform: translate(${columnX(5)}px, ${RAIL_B_Y}px); opacity: 1; }
      92%, 100% { transform: translate(${VIEW_W + 90}px, ${RAIL_B_Y}px); opacity: 0; }
    }
    @keyframes csGateReject {
      0%, ${A_REJECTED - 0.1}% { opacity: 0; }
      ${A_REJECTED}%, ${A_RESET - 0.1}% { opacity: 1; }
      ${A_RESET}%, 100% { opacity: 0; }
    }
    @keyframes csGatePass {
      0%, ${B_AT_GATE - 0.1}% { opacity: 0.34; }
      ${B_AT_GATE}%, ${B_EXITS}% { opacity: 1; }
      92%, 100% { opacity: 0.34; }
    }
    @keyframes csArcPulse {
      0%, ${A_RETURNS - 1}% { stroke-dashoffset: 0; opacity: 0; }
      ${A_RETURNS + 1}%     { stroke-dashoffset: -130; opacity: 1; }
      ${A_RESET - 2}%       { stroke-dashoffset: -930; opacity: 1; }
      ${A_RESET}%, 100%     { stroke-dashoffset: -1010; opacity: 0; }
    }
    ${FINDINGS.map(
      ({ column, at }) => `
    @keyframes csFinding${column} {
      0%, ${at - 0.1}% { opacity: 0; transform: scale(0.3); }
      ${at + 3}%, ${A_RESET - 0.1}% { opacity: 1; transform: scale(1); }
      ${A_RESET}%, 100% { opacity: 0; transform: scale(0.3); }
    }`,
    ).join('')}

    .cs-sl-artifact-a,
    .cs-sl-artifact-b,
    .cs-sl-finding {
      transform-box: view-box;
      transform-origin: 0 0;
    }
    .cs-sl-finding { transform-origin: center; }
    .cs-sl-artifact-a { animation: csArtifactA ${CYCLE_MS}ms cubic-bezier(0.7, 0, 0.3, 1) infinite; }
    .cs-sl-artifact-b { animation: csArtifactB ${CYCLE_MS}ms cubic-bezier(0.7, 0, 0.3, 1) infinite; }
    .cs-sl-reject { animation: csGateReject ${CYCLE_MS}ms linear infinite; }
    .cs-sl-pass { animation: csGatePass ${CYCLE_MS}ms linear infinite; }
    .cs-sl-arc-pulse { animation: csArcPulse ${CYCLE_MS}ms linear infinite; }
    ${FINDINGS.map(
      ({ column }) =>
        `.cs-sl-finding-${column} { animation: csFinding${column} ${CYCLE_MS}ms linear infinite; }`,
    ).join('\n    ')}

    @media (prefers-reduced-motion: reduce) {
      .cs-sl-artifact-a, .cs-sl-artifact-b, .cs-sl-arc-pulse {
        animation: none !important;
        opacity: 0 !important;
      }
      /* The settled frame is the useful one: findings raised, one gate refusing
         and one gate open. The comparison survives without a single moving part. */
      .cs-sl-reject { animation: none !important; opacity: 1 !important; }
      .cs-sl-pass { animation: none !important; opacity: 1 !important; }
      .cs-sl-finding {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `;

  return (
    <section
      data-section="SaasShiftLeft"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      <style>{css}</style>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none mix-blend-overlay md:block"
        style={{
          right: '-150px',
          top: '-175px',
          width: '488px',
          height: '497px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none mix-blend-overlay md:block"
        style={{
          left: '-147px',
          bottom: '-180px',
          width: '469px',
          height: '488px',
          transform: 'rotate(-150deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: 'clamp(60px, 8vw, 128px)',
          paddingBottom: 'clamp(56px, 7vw, 112px)',
        }}
      >
        <div className="mx-auto flex max-w-[860px] flex-col items-center gap-4 text-center">
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: '#ffffff',
                margin: 0,
              }}
            >
              Move Beyond{' '}
              <span
                style={{
                  background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Shift Left
              </span>
            </h2>
          </Reveal>

          <Reveal header delay={0.1} y={20}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.82)',
                maxWidth: '720px',
                margin: 0,
              }}
            >
              Modern applications require security to be built into the software components
              developers use, not added after applications are created.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.16} y={24}>
          <div style={{ marginTop: 'clamp(36px, 4.4vw, 68px)' }}>
            <div className="hidden lg:block">
              <UnverifiedTrack />
              <div style={{ height: 'clamp(30px, 3.4vw, 52px)' }} />
              <VerifiedTrack />
            </div>
            <MobileTracks />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SHARED SVG PIECES                               */
/* -------------------------------------------------------------------------- */

function Defs(): React.ReactElement {
  return (
    <defs>
      <linearGradient id="sl-node-dim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2A2A5C" />
        <stop offset="100%" stopColor="#1A1A3D" />
      </linearGradient>
      <linearGradient id="sl-node-lit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3D5BD6" />
        <stop offset="100%" stopColor="#23309B" />
      </linearGradient>
      <linearGradient id="sl-source" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9A51FF" />
        <stop offset="100%" stopColor="#2CC1EB" />
      </linearGradient>
      <linearGradient id="sl-artifact-dim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D6D2EE" />
        <stop offset="100%" stopColor="#8F88BE" />
      </linearGradient>
      <linearGradient id="sl-artifact-lit" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#BFF3FF" />
        <stop offset="100%" stopColor="#2CC1EB" />
      </linearGradient>
      <linearGradient id="sl-rail-lit" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(127,227,255,0.65)" />
        <stop offset="100%" stopColor="rgba(127,227,255,0.28)" />
      </linearGradient>
    </defs>
  );
}

/** A stage stop. Sits on the rail; its label is HTML underneath. */
function StageNode({
  x,
  y,
  lit,
}: {
  x: number;
  y: number;
  lit: boolean;
}): React.ReactElement {
  return (
    <g>
      {lit ? <circle cx={x} cy={y} r="26" fill="rgba(60,120,255,0.16)" /> : null}
      <circle
        cx={x}
        cy={y}
        r="17"
        fill={lit ? 'url(#sl-node-lit)' : 'url(#sl-node-dim)'}
        stroke={lit ? 'rgba(150,233,255,0.55)' : 'rgba(255,255,255,0.17)'}
        strokeWidth="1.4"
      />
      <circle cx={x} cy={y} r="6" fill={lit ? 'rgba(191,243,255,0.9)' : 'rgba(255,255,255,0.22)'} />
    </g>
  );
}

/*
 * The gate. Two posts and a lintel, with a barrier that is either down across
 * the opening or raised under the lintel. This is the whole comparison in one
 * object, so it is the only element on the rig drawn at full contrast.
 */
function Gate({ x, y, open }: { x: number; y: number; open: boolean }): React.ReactElement {
  const accent = open ? '#5FE3C0' : '#FF6B6B';
  const half = 30;

  return (
    <g
      style={{
        filter: `drop-shadow(0 0 14px ${open ? 'rgba(95,227,192,0.35)' : 'rgba(255,107,107,0.4)'})`,
      }}
    >
      {/* Opening field — brightens on arrival via the animation classes. */}
      <rect
        className={open ? 'cs-sl-pass' : 'cs-sl-reject'}
        x={x - half + 6}
        y={y - 30}
        width={(half - 6) * 2}
        height={60}
        rx="6"
        fill={open ? 'rgba(95,227,192,0.16)' : 'rgba(255,107,107,0.26)'}
      />

      {/* Posts + lintel */}
      <rect x={x - half} y={y - 40} width="6" height="80" rx="3" fill={accent} opacity="0.85" />
      <rect x={x + half - 6} y={y - 40} width="6" height="80" rx="3" fill={accent} opacity="0.85" />
      <rect
        x={x - half}
        y={y - 46}
        width={half * 2}
        height="6"
        rx="3"
        fill={accent}
        opacity="0.85"
      />

      {/* Barrier: down across the opening, or raised under the lintel. Solid,
          with no hatching over it — a dashed outline on top of a filled bar at
          this size reads as a scribble rather than as a barrier. */}
      <rect
        x={x - half + 7}
        y={open ? y - 36 : y - 8}
        width={(half - 7) * 2}
        height={open ? 13 : 16}
        rx="4"
        fill={accent}
      />
      {open ? null : (
        <rect
          x={x - half + 7}
          y={y - 8}
          width={(half - 7) * 2}
          height="16"
          rx="4"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
        />
      )}
    </g>
  );
}

/** The build artifact riding the rail. */
function Artifact({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <g className={lit ? 'cs-sl-artifact-b' : 'cs-sl-artifact-a'}>
      <rect
        x="-13"
        y="-13"
        width="26"
        height="26"
        rx="7"
        fill={lit ? 'url(#sl-artifact-lit)' : 'url(#sl-artifact-dim)'}
        stroke={lit ? 'rgba(191,243,255,0.9)' : 'rgba(255,255,255,0.45)'}
        strokeWidth="1.4"
      />
      {lit ? (
        <path
          d="M-5 0 L-1.5 3.5 L5.5 -3.5"
          fill="none"
          stroke="#0B2430"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path
            d="M-4.5 -3.5 L-7.5 0 L-4.5 3.5"
            fill="none"
            stroke="rgba(45,35,80,0.75)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 -3.5 L7.5 0 L4.5 3.5"
            fill="none"
            stroke="rgba(45,35,80,0.75)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TRACKS                                    */
/* -------------------------------------------------------------------------- */

function UnverifiedTrack(): React.ReactElement {
  const gateX = columnX(5);
  const startX = columnX(1);
  const arc = `M ${gateX} ${RAIL_A_Y - 48} C ${gateX} 14, ${startX} 14, ${startX} ${RAIL_A_Y - 24}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} 190`}
        className="w-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <Defs />

        {/* Return arc — the shape of the problem. Always drawn, so the loop is
            readable with the animation paused. */}
        <path
          d={arc}
          stroke="rgba(255,180,180,0.32)"
          strokeWidth="1.6"
          strokeDasharray="7 7"
          strokeLinecap="round"
        />
        <path
          className="cs-sl-arc-pulse"
          d={arc}
          stroke="#FF9E9E"
          strokeWidth="2.4"
          strokeDasharray="90 2000"
          strokeLinecap="round"
        />
        <path
          d={`M ${startX - 6} ${RAIL_A_Y - 32} L ${startX} ${RAIL_A_Y - 24} L ${startX + 6} ${RAIL_A_Y - 32}`}
          stroke="rgba(255,180,180,0.6)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Rail */}
        <line
          x1={startX}
          y1={RAIL_A_Y}
          x2={gateX - 34}
          y2={RAIL_A_Y}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.6"
        />

        {[1, 2, 3, 4].map((column) => (
          <StageNode key={column} x={columnX(column)} y={RAIL_A_Y} lit={false} />
        ))}

        <Gate x={gateX} y={RAIL_A_Y} open={false} />

        {FINDINGS.map(({ column }) => (
          <g
            key={column}
            className={`cs-sl-finding cs-sl-finding-${column}`}
            style={{ transformOrigin: `${columnX(column) + 14}px ${RAIL_A_Y - 14}px` }}
          >
            <circle cx={columnX(column) + 14} cy={RAIL_A_Y - 14} r="8.5" fill="#FF6B6B" />
            <path
              d={`M ${columnX(column) + 14} ${RAIL_A_Y - 18} v 4.4`}
              stroke="#3A0B14"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={columnX(column) + 14} cy={RAIL_A_Y - 11} r="1.2" fill="#3A0B14" />
          </g>
        ))}

        <Artifact lit={false} />
      </svg>

      <StageLabels stages={STAGES_A} offset={1} lit={false} />
    </div>
  );
}

function VerifiedTrack(): React.ReactElement {
  const gateX = columnX(5);
  const sourceX = columnX(0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} 124`}
        className="w-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <Defs />

        <line
          x1={sourceX}
          y1={RAIL_B_Y}
          x2={gateX - 34}
          y2={RAIL_B_Y}
          stroke="url(#sl-rail-lit)"
          strokeWidth="1.8"
        />

        {/* Source. The largest object on the rig — it is the one thing this
            track has that the other does not, so it gets the weight. */}
        <circle cx={sourceX} cy={RAIL_B_Y} r="38" fill="rgba(154,81,255,0.16)" />
        <circle
          cx={sourceX}
          cy={RAIL_B_Y}
          r="27"
          fill="url(#sl-source)"
          stroke="rgba(191,243,255,0.85)"
          strokeWidth="1.8"
        />
        <path
          d={`M ${sourceX - 9} ${RAIL_B_Y} L ${sourceX - 3} ${RAIL_B_Y + 6.5} L ${sourceX + 9.5} ${RAIL_B_Y - 6.5}`}
          fill="none"
          stroke="#0B1F2E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {[1, 2, 3, 4].map((column) => (
          <StageNode key={column} x={columnX(column)} y={RAIL_B_Y} lit />
        ))}

        <Gate x={gateX} y={RAIL_B_Y} open />

        {/* Exit — the track continues past the gate and leaves. */}
        <line
          x1={gateX + 34}
          y1={RAIL_B_Y}
          x2={VIEW_W - 6}
          y2={RAIL_B_Y}
          stroke="rgba(95,227,192,0.5)"
          strokeWidth="1.8"
          strokeDasharray="6 6"
        />
        <path
          d={`M ${VIEW_W - 16} ${RAIL_B_Y - 7} L ${VIEW_W - 6} ${RAIL_B_Y} L ${VIEW_W - 16} ${RAIL_B_Y + 7}`}
          stroke="#5FE3C0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Artifact lit />
      </svg>

      <StageLabels stages={STAGES_B} offset={0} lit />
    </div>
  );
}

/*
 * Labels are HTML, not SVG text. Inside the viewBox they would scale with the
 * rig and fall to ~11px at the narrow end of the desktop range; as HTML they
 * hold the type token. The six-column grid puts each label centre on
 * (i + 0.5) / 6, which is exactly where columnX() places its node.
 */
function StageLabels({
  stages,
  offset,
  lit,
}: {
  stages: readonly string[];
  offset: number;
  lit: boolean;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-6" style={{ marginTop: '6px' }}>
      {Array.from({ length: COLUMNS }, (_, column) => {
        const stage = stages[column - offset];
        return (
          <div
            key={stage ?? `empty-${column}`}
            className="px-1 text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(12px, 1vw, 14px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              color: stage
                ? lit
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.56)'
                : 'transparent',
            }}
          >
            {stage ?? ''}
          </div>
        );
      })}
    </div>
  );
}

/*
 * Below lg the rig stacks. Six stops across cannot hold a label, and a rail that
 * scrolls sideways hides half of a comparison. The verified track keeps its
 * extra source chip and both gates keep their verdict colour, so the shape of
 * the argument survives the reflow even though the motion does not.
 */
function MobileTracks(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6 lg:hidden">
      {[
        { stages: STAGES_A, lit: false },
        { stages: STAGES_B, lit: true },
      ].map(({ stages, lit }) => (
        <div key={lit ? 'verified' : 'unverified'} className="flex flex-col gap-2">
          {stages.map((stage, i) => {
            const isSource = lit && i === 0;
            const isGate = i === stages.length - 1;
            const accent = lit ? '#5FE3C0' : '#FF6B6B';
            return (
              <div
                key={stage}
                className="flex items-center justify-center"
                style={{
                  minHeight: '46px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                  background: isSource
                    ? 'linear-gradient(135deg, rgba(154,81,255,0.34) 0%, rgba(44,193,235,0.30) 100%)'
                    : isGate
                      ? `${accent}22`
                      : lit
                        ? 'rgba(255,255,255,0.09)'
                        : 'rgba(255,255,255,0.045)',
                  border: isGate
                    ? `1.5px solid ${accent}`
                    : isSource
                      ? '1px solid rgba(150,233,255,0.62)'
                      : '1px solid rgba(255,255,255,0.14)',
                  color: lit ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                }}
              >
                {stage}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
