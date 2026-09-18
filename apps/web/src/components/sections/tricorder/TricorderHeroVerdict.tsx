'use client';

import { ShieldAlert, ShieldCheck, ShieldQuestionMark, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SIGNAL, VERDICT } from './tricorder-palette';

/**
 * Tricorder hero artifact: one dependency, judged before it is trusted.
 *
 * The loop tells the product's story in four beats:
 *  1. ARRIVE: a neutral package settles at the centre.
 *  2. EXAMINE: four inputs feed it in pipeline order, each stage reading its
 *     own signal: Analyze reads behaviour (teal), Compare reads history (blue),
 *     Correlate reads relationships (violet), Enrich brings threat
 *     intelligence (amber). A scan line passes over the package per stage and
 *     the ring quarter facing that input fills.
 *  3. DECIDE: the ring resolves into one verdict, shown as colour AND shape
 *     (shield-alert, shield-question, shield-check) so it survives greyscale
 *     and small sizes.
 *  4. RESET: the package leaves and the next one arrives.
 *
 * Passes cycle Malicious, Uncertain, Pass, so the first thing a visitor sees
 * is a package rejected. The artifact never rests on Pass: the page's argument
 * is that "safe" cannot be assumed.
 *
 * The only words are the four stage names, which are the copy doc's.
 *
 * Deliberately not a radar (that reads as runtime monitoring, CleanSight's job)
 * and deliberately free of the Isolation section's labelled icons, so that
 * section keeps its explanation. Before hydration, under reduced motion and
 * off screen the loop does not run; the still frame shows the package, all
 * four inputs and the three outcomes with equal weight.
 *
 * Everything is drawn in one 400 x 400 SVG space; the verdict badge is HTML
 * positioned in percent of the same square.
 */

const C = 200;
const RING_R = 100;
const SOURCE_R = 172;
/** Half-width of a stage's ring quarter, leaving a small gap between quarters. */
const SEG_HALF = 40;

interface Input {
  color: string;
  /** Degrees clockwise from 12 o'clock. */
  angle: number;
  /** The copy doc's stage name, the only words in the artifact. */
  label: string;
  /**
   * Threat intelligence is the one input a CVE scanner does not have, so its
   * source is drawn larger, carries an orbit and fires a pulse when it feeds.
   */
  external?: boolean;
}

/** Pipeline order: Analyze, Compare, Correlate, Enrich. */
const INPUTS: readonly [Input, Input, Input, Input] = [
  { color: SIGNAL.behavior, angle: 315, label: 'Analyze' },
  { color: SIGNAL.history, angle: 45, label: 'Compare' },
  { color: SIGNAL.relationships, angle: 135, label: 'Correlate' },
  { color: SIGNAL.intel, angle: 225, label: 'Enrich', external: true },
];

interface Outcome {
  color: string;
  icon: LucideIcon;
}

const OUTCOMES: readonly [Outcome, Outcome, Outcome] = [
  { color: VERDICT.malicious, icon: ShieldAlert },
  { color: VERDICT.uncertain, icon: ShieldQuestionMark },
  { color: VERDICT.pass, icon: ShieldCheck },
];

/** Beat durations: arrive, four inputs, decide, reset. */
const STEP_MS = [700, 900, 900, 900, 900, 1900, 550] as const;
const DECIDE = 5;
const RESET = 6;

const NEUTRAL = '#8d94c4';
/**
 * Examination colour. The ring and cube never take an input's colour, because
 * the signal palette overlaps the verdict palette (intel and uncertain are both
 * amber, behavior and pass both teal): verdict colours belong to the decision.
 */
const EXAMINE = '#8fb6ff';

const round = (n: number): number => Math.round(n * 100) / 100;

function polar(r: number, angle: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  return { x: round(C + r * Math.sin(rad)), y: round(C - r * Math.cos(rad)) };
}

/** A stream curving from its source into the middle of its own ring quarter. */
function streamPath(angle: number): string {
  const s = polar(SOURCE_R, angle);
  const ctrl = polar(142, angle - 14);
  const e = polar(RING_R + 5, angle);
  return `M ${s.x} ${s.y} Q ${ctrl.x} ${ctrl.y} ${e.x} ${e.y}`;
}

function arc(r: number, from: number, to: number): string {
  const a = polar(r, from);
  const b = polar(r, to);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

interface LoopState {
  step: number;
  outcome: number;
  animated: boolean;
}

function useVerdictLoop(target: React.RefObject<HTMLElement | null>): LoopState {
  const [state, setState] = useState<LoopState>({ step: 0, outcome: 0, animated: false });

  useEffect(() => {
    const node = target.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | undefined;
    let visible = false;
    let current: LoopState = { step: 0, outcome: 0, animated: true };

    const schedule = (): void => {
      timer = window.setTimeout(() => {
        timer = undefined;
        const step = (current.step + 1) % STEP_MS.length;
        current = {
          step,
          outcome: step === 0 ? (current.outcome + 1) % OUTCOMES.length : current.outcome,
          animated: true,
        };
        setState(current);
        if (visible) schedule();
      }, STEP_MS[current.step]);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (visible && timer === undefined) {
          setState(current);
          schedule();
        } else if (!visible && timer !== undefined) {
          window.clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [target]);

  return state;
}

/** Isometric package: three shaded faces and a tape band across the top. */
function PackageCube({ tint, glow }: { tint: string; glow: string | null }): React.ReactElement {
  const face = (mix: string): React.CSSProperties => ({ fill: mix, transition: 'fill 500ms ease' });
  return (
    <g>
      <ellipse
        cx={C}
        cy={283}
        rx={62}
        ry={11}
        fill="rgba(10,6,40,0.55)"
        filter="url(#tri-hv-blur)"
      />
      <g
        style={{
          filter: glow
            ? `drop-shadow(0 0 14px ${glow})`
            : 'drop-shadow(0 10px 18px rgba(8,4,40,0.6))',
          transition: 'filter 500ms ease',
        }}
      >
        <path
          d="M 200 134 L 257 167 L 200 200 L 143 167 Z"
          style={face(`color-mix(in srgb, ${tint} 45%, #ffffff)`)}
        />
        <path d="M 143 167 L 200 200 L 200 266 L 143 233 Z" style={face(tint)} />
        <path
          d="M 200 200 L 257 167 L 257 233 L 200 266 Z"
          style={face(`color-mix(in srgb, ${tint} 62%, #0b0830)`)}
        />
        <path
          d="M 228.5 150.5 L 171.5 183.5 L 171.5 249.5"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="5"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 200 134 L 257 167 L 257 233 L 200 266 L 143 233 L 143 167 Z M 143 167 L 200 200 L 257 167 M 200 200 L 200 266"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </g>
  );
}

export function TricorderHeroVerdict(): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const { step, outcome, animated } = useVerdictLoop(root);

  const verdict = OUTCOMES[outcome] ?? OUTCOMES[0];
  const activeInput = animated && step >= 1 && step <= 4 ? step - 1 : -1;
  const deciding = animated && step === DECIDE;
  const resetting = animated && step === RESET;
  const cubeTint = deciding ? `color-mix(in srgb, ${verdict.color} 70%, ${NEUTRAL})` : NEUTRAL;
  const cubeGlow = deciding ? verdict.color : activeInput >= 0 ? EXAMINE : null;
  const VerdictIcon = verdict.icon;

  return (
    <div ref={root} aria-hidden className="relative mx-auto aspect-square w-full select-none">
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <radialGradient id="tri-hv-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a5cff" stopOpacity="0.32" />
            <stop offset="65%" stopColor="#2a1f8f" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#2a1f8f" stopOpacity="0" />
          </radialGradient>
          <filter id="tri-hv-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <clipPath id="tri-hv-cube">
            <path d="M 200 134 L 257 167 L 257 233 L 200 266 L 143 233 L 143 167 Z" />
          </clipPath>
          <linearGradient id="tri-hv-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx={C} cy={C} r={196} fill="url(#tri-hv-floor)" />
        <circle
          cx={C}
          cy={C}
          r={SOURCE_R}
          stroke="#ffffff"
          strokeOpacity="0.08"
          strokeDasharray="2 6"
        />
        <circle cx={C} cy={C} r={136} stroke="#ffffff" strokeOpacity="0.05" />

        {/* The four inputs, in pipeline order. */}
        {INPUTS.map((input, i) => {
          const active = activeInput === i;
          const lit = !animated || active;
          const src = polar(SOURCE_R, input.angle);
          const d = streamPath(input.angle);
          const core = input.external ? (active ? 12 : 10) : active ? 9 : 7;
          return (
            <g key={input.angle}>
              <path
                d={d}
                stroke={input.color}
                strokeWidth={active ? 10 : 0}
                strokeOpacity="0.18"
                strokeLinecap="round"
                style={{ transition: 'stroke-width 400ms ease' }}
              />
              <path
                d={d}
                className={animated ? 'cs-tri-stream' : undefined}
                stroke={input.color}
                strokeWidth={active ? 2.6 : 1.4}
                strokeOpacity={lit ? 0.95 : 0.4}
                strokeLinecap="round"
                strokeDasharray="3 7"
                style={{ transition: 'stroke-opacity 400ms ease, stroke-width 400ms ease' }}
              />
              <circle
                cx={src.x}
                cy={src.y}
                r={input.external ? 26 : 20}
                fill={input.color}
                fillOpacity={active ? 0.24 : input.external ? 0.14 : 0.08}
              />
              {input.external ? (
                <>
                  <circle
                    cx={src.x}
                    cy={src.y}
                    r={19}
                    stroke={input.color}
                    strokeOpacity="0.7"
                    strokeWidth="1.2"
                    strokeDasharray="2 4"
                    className={animated ? 'cs-tri-orbit' : undefined}
                    style={{ transformOrigin: `${src.x}px ${src.y}px`, transformBox: 'view-box' }}
                  />
                  {active ? (
                    <circle
                      key={`pulse-${step}`}
                      cx={src.x}
                      cy={src.y}
                      r={14}
                      stroke={input.color}
                      strokeWidth="2"
                      className="cs-tri-intel-pulse"
                      style={{ transformOrigin: `${src.x}px ${src.y}px`, transformBox: 'view-box' }}
                    />
                  ) : null}
                </>
              ) : null}
              <circle
                cx={src.x}
                cy={src.y}
                r={core}
                fill={input.color}
                fillOpacity={lit ? 1 : 0.7}
                style={{ transition: 'r 400ms ease, fill-opacity 400ms ease' }}
              />
              <circle cx={src.x} cy={src.y} r={3} fill="#ffffff" fillOpacity={lit ? 0.85 : 0.4} />
            </g>
          );
        })}

        {/* Verdict ring: four quarters, one per stage, each centred on where
            its stream lands. A quarter fills during its own stage and stays
            lit; at the decision all four take the verdict colour. */}
        <circle cx={C} cy={C} r={RING_R} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="5" />
        {animated
          ? INPUTS.map((input, i) => {
              const filled = deciding || (step >= i + 1 && step <= INPUTS.length);
              const stepActive = activeInput === i;
              return (
                <path
                  key={input.label}
                  d={arc(RING_R, input.angle - SEG_HALF, input.angle + SEG_HALF)}
                  pathLength={1}
                  stroke={deciding ? verdict.color : EXAMINE}
                  // An empty quarter still paints its round caps as dots, so hide it.
                  strokeOpacity={!filled && !stepActive ? 0 : deciding || stepActive ? 1 : 0.7}
                  strokeWidth={deciding ? 7 : 5}
                  strokeLinecap="round"
                  strokeDasharray="1 1"
                  strokeDashoffset={filled ? 0 : 1}
                  style={{
                    transition: resetting
                      ? 'none'
                      : 'stroke-dashoffset 850ms cubic-bezier(0.22,1,0.36,1), stroke 400ms ease, stroke-width 400ms ease, stroke-opacity 400ms ease',
                    filter: deciding ? `drop-shadow(0 0 10px ${verdict.color})` : 'none',
                  }}
                />
              );
            })
          : OUTCOMES.map((o, i) => (
              <path
                key={o.color}
                d={arc(RING_R, i * 120 + 8, i * 120 + 112)}
                stroke={o.color}
                strokeWidth="5"
                strokeLinecap="round"
              />
            ))}

        <g
          style={{
            opacity: resetting ? 0 : 1,
            transform: resetting ? 'translateY(-14px) scale(0.92)' : 'none',
            transformOrigin: `${C}px ${C}px`,
            transformBox: 'view-box',
            transition: 'opacity 450ms ease, transform 450ms ease',
          }}
        >
          <PackageCube tint={cubeTint} glow={cubeGlow} />
          {activeInput >= 0 ? (
            <g clipPath="url(#tri-hv-cube)">
              <rect
                key={`scan-${step}`}
                className="cs-tri-scanline"
                x={138}
                y={126}
                width={124}
                height={20}
                fill="url(#tri-hv-scan)"
              />
            </g>
          ) : null}
        </g>
      </svg>

      {/* Stage names, set outward from each source. The artifact only renders
          from md up, where caption type is legible. */}
      {INPUTS.map((input, i) => {
        const src = polar(SOURCE_R, input.angle);
        const top = src.y < C;
        const active = activeInput === i;
        return (
          <span
            key={input.label}
            className="absolute -translate-x-1/2 whitespace-nowrap font-display uppercase transition-opacity duration-400"
            style={{
              left: `${src.x / 4}%`,
              top: `${(src.y + (top ? -44 : 30)) / 4}%`,
              fontSize: 'var(--fs-badge)',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: `color-mix(in srgb, ${input.color} 60%, #ffffff)`,
              opacity: !animated || active ? 1 : 0.55,
            }}
          >
            {input.label}
          </span>
        );
      })}

      {/* The verdict: colour and shape, so it reads in greyscale and at phone size. */}
      <span
        className="absolute flex items-center justify-center rounded-full transition-[transform,opacity] duration-500"
        style={{
          left: '62%',
          top: '60%',
          width: '15%',
          height: '15%',
          background: `linear-gradient(180deg, color-mix(in srgb, ${verdict.color} 80%, #ffffff) 0%, ${verdict.color} 55%, color-mix(in srgb, ${verdict.color} 70%, #1a0a2a) 100%)`,
          boxShadow: `0 10px 24px -6px ${verdict.color}, inset 0 1px 1px rgba(255,255,255,0.6), 0 0 0 4px rgba(15,12,50,0.85)`,
          opacity: deciding ? 1 : 0,
          transform: deciding ? 'scale(1)' : 'scale(0.4)',
          transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <VerdictIcon className="h-[52%] w-[52%]" strokeWidth={2.2} color="#ffffff" />
      </span>
    </div>
  );
}
