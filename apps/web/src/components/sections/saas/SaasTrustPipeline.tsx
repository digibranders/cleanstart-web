'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { PIPELINE_STAGES, type StageId } from './saasPipelineStages';
import styles from './SaasTrustPipeline.module.css';

/*
 * "Move Beyond Shift Left" scene.
 *
 * A standard delivery pipeline (Code, Build, Test, Deploy, Security Review,
 * Trusted Release) stands in one neutral treatment. Verified Components is a
 * separate object: it flies in from off-canvas left, docks into an empty socket
 * at the head of the rail, and only then does green run through the pipeline.
 * Each stage keeps its colour and earns a check as the front passes; Security
 * Review's amber "unverified" marker resolves the same way; Trusted Release is
 * the one stage that turns green, because it inherits what the components
 * brought in.
 *
 * The story is a phase machine driven by a JS clock. Every visual change is a
 * CSS transition keyed off `data-*` flags on the root, so the stylesheet owns
 * timing and easing and this file owns only the order of beats. Stage timing
 * along the rail is positional (`--frac`), so the check badges land exactly as
 * the fill front crosses them.
 *
 * Two orientations render from the same geometry description: horizontal for
 * `lg` and up, vertical below. Both are decorative (`aria-hidden`); the ordered
 * list in SaasShiftLeft is the accessible reading.
 */

const PHASES = ['idle', 'flight', 'approach', 'docked', 'fill', 'settled', 'exit'] as const;
type Phase = (typeof PHASES)[number];

/* Beat length (ms) for each phase. `flight` + `approach` add up to the hero's
   2.6 s flight in the stylesheet; `fill` is the 3.2 s rail sweep plus the
   0.9 s release bloom, so the hold starts on a still frame. */
const BEATS: Record<Phase, number> = {
  idle: 600,
  flight: 1600,
  approach: 1000,
  docked: 500,
  fill: 4200,
  settled: 3000,
  exit: 450,
};

const SOURCE_LABEL = 'Verified Components';
const SOURCE_NOTE = 'Verified before the pipeline starts';

const CHIPS = ['Base image', 'Runtime', 'Libraries'] as const;

type Orientation = 'horizontal' | 'vertical';

interface Point {
  readonly x: number;
  readonly y: number;
}

interface TextAnchor extends Point {
  readonly anchor: 'middle' | 'start';
}

interface Layout {
  readonly width: number;
  readonly height: number;
  readonly socket: Point;
  readonly socketR: number;
  /** Hero flight path, off-canvas to the socket centre. */
  readonly flight: string;
  readonly rail: { readonly from: Point; readonly to: Point };
  readonly stages: readonly Point[];
  readonly stageLabel: (stage: Point) => TextAnchor;
  readonly sourceLabel: TextAnchor;
  readonly sourceNote: TextAnchor;
  /** The note, split into lines where the orientation has no room for one. */
  readonly sourceNoteLines: readonly string[];
  readonly labelSize: number;
}

const TILE = 84;
const TILE_R = 22;

const HORIZONTAL: Layout = {
  width: 1200,
  height: 380,
  socket: { x: 216, y: 224 },
  socketR: 56,
  flight: 'M -170 108 L 90 108 C 170 108, 216 142, 216 224',
  rail: { from: { x: 278, y: 224 }, to: { x: 1064, y: 224 } },
  stages: [392, 524, 656, 788, 920, 1064].map((x) => ({ x, y: 224 })),
  stageLabel: (s) => ({ x: s.x, y: s.y + TILE / 2 + 28, anchor: 'middle' }),
  sourceLabel: { x: 216, y: 310, anchor: 'middle' },
  sourceNote: { x: 216, y: 333, anchor: 'middle' },
  sourceNoteLines: [SOURCE_NOTE],
  labelSize: 15,
};

const VERTICAL: Layout = {
  width: 360,
  height: 860,
  socket: { x: 78, y: 150 },
  socketR: 56,
  flight: 'M -170 70 C -20 70, 78 60, 78 150',
  rail: { from: { x: 78, y: 212 }, to: { x: 78, y: 782 } },
  stages: [270, 370, 470, 570, 670, 782].map((y) => ({ x: 78, y })),
  stageLabel: (s) => ({ x: s.x + TILE / 2 + 20, y: s.y + 6, anchor: 'start' }),
  sourceLabel: { x: 150, y: 146, anchor: 'start' },
  sourceNote: { x: 150, y: 170, anchor: 'start' },
  sourceNoteLines: ['Verified before', 'the pipeline starts'],
  labelSize: 16,
};

const LAYOUTS: Record<Orientation, Layout> = { horizontal: HORIZONTAL, vertical: VERTICAL };

function railLength(rail: Layout['rail']): number {
  return Math.hypot(rail.to.x - rail.from.x, rail.to.y - rail.from.y);
}

/** 0..1 position of a stage centre along the rail. */
function railFraction(rail: Layout['rail'], stage: Point): number {
  const along = Math.hypot(stage.x - rail.from.x, stage.y - rail.from.y);
  return along / railLength(rail);
}

/** Pointy-top hexagon centred on the origin. */
function hexagon(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (-90 + 60 * i);
    pts.push(`${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/* Lucide glyphs on the 24 grid, drawn at 34 in an 84 tile (about 40%, the
   usual icon-in-tile ratio). None of the pipeline glyphs carries a check: the
   badge that lands on each tile is the check, and a tile that already shows
   one would look verified before the sweep arrives. */
const ICON = 34;

const ICON_PROPS = {
  width: ICON,
  height: ICON,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function StageIcon({ id, at }: { id: StageId; at: Point }): React.ReactElement {
  const frame = { ...ICON_PROPS, x: at.x - ICON / 2, y: at.y - ICON / 2 };
  switch (id) {
    case 'code':
      return (
        <svg {...frame}>
          <path d="m16 18 6-6-6-6" />
          <path d="m8 6-6 6 6 6" />
        </svg>
      );
    case 'build':
      return (
        <svg {...frame}>
          <path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" />
          <path d="m18 15 4-4" />
          <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
        </svg>
      );
    case 'test':
      return (
        <svg {...frame}>
          <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
          <path d="M6.453 15h11.094" />
          <path d="M8.5 2h7" />
        </svg>
      );
    case 'deploy':
      return (
        <svg {...frame}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case 'review':
      return (
        <svg {...frame}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <circle cx="11.2" cy="11.2" r="2.7" />
          <path d="m13.2 13.2 2.4 2.4" />
        </svg>
      );
    case 'release':
      return (
        <svg {...frame}>
          <path d="m16 16 2 2 4-4" />
          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
          <path d="m7.5 4.27 9 5.15" />
          <path d="M3.29 7 12 12l8.71-5" />
          <path d="M12 22V12" />
        </svg>
      );
  }
}

interface SceneProps {
  readonly orientation: Orientation;
  readonly phase: Phase;
}

function Scene({ orientation, phase }: SceneProps): React.ReactElement {
  const L = LAYOUTS[orientation];
  const idx = PHASES.indexOf(phase);
  const reached = (p: Phase): true | undefined => (idx >= PHASES.indexOf(p) ? true : undefined);
  const uid = orientation === 'horizontal' ? 'h' : 'v';
  const len = railLength(L.rail);
  const railPath = `M ${L.rail.from.x} ${L.rail.from.y} L ${L.rail.to.x} ${L.rail.to.y}`;
  const withChips = orientation === 'horizontal';

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`${styles.scene} ${styles[orientation]}`}
      viewBox={`0 0 ${L.width} ${L.height}`}
      data-scene={orientation}
      data-phase={phase}
      data-flying={reached('flight')}
      data-approach={reached('approach')}
      data-docked={reached('docked')}
      data-fill={reached('fill')}
      data-settled={reached('settled')}
      data-exit={phase === 'exit' ? true : undefined}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <defs>
        <linearGradient id={`${uid}-hero`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3FEBAC" />
          <stop offset="1" stopColor="#0FA075" />
        </linearGradient>
        <radialGradient id={`${uid}-heroGlow`}>
          <stop offset="0" stopColor="#34E3A6" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#34E3A6" stopOpacity="0.1" />
          <stop offset="1" stopColor="#34E3A6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-trail`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#34E3A6" stopOpacity="0" />
          <stop offset="1" stopColor="#34E3A6" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient
          id={`${uid}-rail`}
          gradientUnits="userSpaceOnUse"
          x1={L.rail.from.x}
          y1={L.rail.from.y}
          x2={L.rail.to.x}
          y2={L.rail.to.y}
        >
          <stop offset="0" stopColor="#34E3A6" />
          <stop offset="1" stopColor="#6FF5CB" />
        </linearGradient>
        <linearGradient id={`${uid}-release`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3FEBAC" />
          <stop offset="1" stopColor="#14B27F" />
        </linearGradient>
        <radialGradient id={`${uid}-socketGlow`}>
          <stop offset="0" stopColor="#34E3A6" stopOpacity="0.22" />
          <stop offset="1" stopColor="#34E3A6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow around the socket, brightens once docked. */}
      <circle
        className={styles.socketGlow}
        cx={L.socket.x}
        cy={L.socket.y}
        r={L.socketR * 2.4}
        fill={`url(#${uid}-socketGlow)`}
      />

      {/* Rail: base, then the green fill that sweeps it. */}
      <path className={styles.railBase} d={railPath} strokeLinecap="round" />
      <path
        className={styles.railFill}
        d={railPath}
        stroke={`url(#${uid}-rail)`}
        strokeLinecap="round"
        style={{ ['--len' as string]: len.toFixed(2) }}
      />

      {/* Socket: the empty slot at the head of the pipeline. */}
      <g transform={`translate(${L.socket.x} ${L.socket.y})`}>
        <path className={styles.socketFace} d={hexagon(L.socketR)} />
        <path className={styles.socketRing} d={hexagon(L.socketR)} />
        <circle className={styles.burst} r={L.socketR} />
      </g>

      {/* Stages. */}
      {PIPELINE_STAGES.map((stage, i) => {
        const at = L.stages[i];
        if (!at) return null;
        const frac = railFraction(L.rail, at);
        const label = L.stageLabel(at);
        const isRelease = stage.id === 'release';
        const isReview = stage.id === 'review';
        return (
          <g
            key={stage.id}
            data-stage={stage.id}
            className={styles.stage}
            style={{ ['--frac' as string]: frac.toFixed(4) }}
          >
            {isRelease ? <circle className={styles.bloom} cx={at.x} cy={at.y} r={TILE * 0.62} /> : null}
            <rect
              className={styles.tile}
              x={at.x - TILE / 2}
              y={at.y - TILE / 2}
              width={TILE}
              height={TILE}
              rx={TILE_R}
            />
            {isRelease ? (
              <rect
                className={styles.releaseFill}
                x={at.x - TILE / 2}
                y={at.y - TILE / 2}
                width={TILE}
                height={TILE}
                rx={TILE_R}
                fill={`url(#${uid}-release)`}
              />
            ) : null}
            <g className={isRelease ? styles.releaseIcon : styles.icon}>
              <StageIcon id={stage.id} at={at} />
            </g>
            <text
              className={isRelease ? styles.releaseLabel : styles.label}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              fontSize={L.labelSize}
              fontWeight={500}
            >
              {stage.label}
            </text>

            {isReview ? (
              <g className={styles.amber} transform={`translate(${at.x + 34} ${at.y - 34})`}>
                <circle className={styles.amberRing} r="9" />
                <circle r="5" fill="#F5B94A" />
              </g>
            ) : null}

            {isRelease ? null : (
              <g transform={`translate(${at.x + 34} ${at.y - 34})`}>
                <g className={styles.badge}>
                  <circle r="10" fill="#34E3A6" />
                  <polyline
                    points="-4 0.5 -1.2 3.2 4.2 -3"
                    fill="none"
                    stroke="#062A1F"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </g>
            )}
          </g>
        );
      })}

      {/* Source label: lands once the hero has docked. */}
      <text
        className={styles.sourceLabel}
        x={L.sourceLabel.x}
        y={L.sourceLabel.y}
        textAnchor={L.sourceLabel.anchor}
        fontSize={L.labelSize}
        fontWeight={600}
      >
        {SOURCE_LABEL}
      </text>
      <text
        className={styles.sourceNote}
        x={L.sourceNote.x}
        y={L.sourceNote.y}
        textAnchor={L.sourceNote.anchor}
        fontSize={12}
        fontWeight={500}
      >
        {L.sourceNoteLines.map((line, i) => (
          <tspan key={line} x={L.sourceNote.x} dy={i === 0 ? 0 : 16}>
            {line}
          </tspan>
        ))}
      </text>

      {/* The hero. Drawn centred on the origin and carried along the flight
          path by `offset-path`, so nothing here knows where the socket is. */}
      <g className={styles.hero} style={{ offsetPath: `path("${L.flight}")` }}>
        {withChips ? (
          <rect className={styles.trail} x="-210" y="-13" width="160" height="26" rx="13" fill={`url(#${uid}-trail)`} />
        ) : null}
        {withChips
          ? CHIPS.map((chip, i) => {
              const spots: readonly Point[] = [
                { x: -142, y: -42 },
                { x: -172, y: 0 },
                { x: -142, y: 42 },
              ];
              const at = spots[i] ?? { x: -150, y: 0 };
              return (
                <g key={chip} transform={`translate(${at.x} ${at.y})`}>
                  <g
                    className={styles.chip}
                    style={{
                      ['--dx' as string]: `${-at.x}px`,
                      ['--dy' as string]: `${-at.y}px`,
                      ['--i' as string]: i,
                    }}
                  >
                    <rect x="-44" y="-12" width="88" height="24" rx="12" className={styles.chipFace} />
                    <text textAnchor="middle" y="4" fontSize="11" fontWeight={500} className={styles.chipText}>
                      {chip}
                    </text>
                  </g>
                </g>
              );
            })
          : null}
        <circle r="74" fill={`url(#${uid}-heroGlow)`} />
        <g className={styles.heroBody}>
          <path d={hexagon(52)} fill={`url(#${uid}-hero)`} />
          <path d={hexagon(52)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <path d={hexagon(42)} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          <g fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
            <path d="M0 -19 L18 -10 L0 -1 L-18 -10 Z" fill="rgba(255,255,255,0.92)" stroke="none" />
            <path d="M-18 -1 L0 8 L18 -1" />
            <path d="M-18 8 L0 17 L18 8" strokeOpacity="0.65" />
          </g>
          <g transform="translate(31 31)">
            <circle r="13" fill="#0A1E2C" stroke="#34E3A6" strokeWidth="1.5" />
            <polyline
              points="-5 0.5 -1.6 4 5.5 -4"
              fill="none"
              stroke="#5CF0C0"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function SaasTrustPipeline(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() === true;
  const inView = useInView(ref, { amount: 0.2 });
  /* Fail-open, as in Reveal: if the observer has not reported an element that
     is already on screen shortly after mount (a race seen on client-side
     navigation), start from geometry rather than leave the socket empty. */
  const [forced, setForced] = useState(false);
  /* Server-render the settled state so the diagram reads without JS and under
     reduced motion; the clock rewinds to idle on mount when it can animate. */
  const [phase, setPhase] = useState<Phase>('settled');

  useEffect(() => {
    if (inView) {
      setForced(false);
      return;
    }
    const id = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh && rect.bottom > 0) setForced(true);
    }, 200);
    return () => window.clearTimeout(id);
  }, [inView]);

  const active = inView || forced;

  useEffect(() => {
    if (reduce) {
      setPhase('settled');
      return;
    }
    setPhase('idle');
    if (!active) return;

    let i = 0;
    let timer = 0;
    const step = (): void => {
      const current = PHASES[i] ?? 'idle';
      setPhase(current);
      timer = window.setTimeout(() => {
        i = (i + 1) % PHASES.length;
        step();
      }, BEATS[current]);
    };
    step();
    return () => window.clearTimeout(timer);
  }, [active, reduce]);

  return (
    <div ref={ref} className={styles.deck} data-trust-pipeline="">
      <Scene orientation="horizontal" phase={phase} />
      <Scene orientation="vertical" phase={phase} />
    </div>
  );
}
