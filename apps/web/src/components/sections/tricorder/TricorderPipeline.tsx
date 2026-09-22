'use client';

import {
  GitCompareArrows,
  Network,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestionMark,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Reveal } from '@/components/ui/Reveal';
import { IconSphere } from './IconSphere';
import { VERDICT } from './tricorder-palette';

/**
 * "From Signals to Verdicts." drawn as one instrument: a verdict engine.
 *
 * Inside a white panel, signal particles stream along a rail through
 * four stations (a blue icon sphere set on the rail each) and into a Verdict
 * card listing the three outcomes. A scan runs while the section is on
 * screen: stations light and ping in order, the rail fills, and on arrival
 * one outcome is selected. Each pass selects the next outcome.
 *
 * Before hydration and under reduced motion the engine renders fully lit and
 * still, with no outcome selected (that would claim one particular verdict).
 *
 * Every word is the copy doc's.
 */

interface Stage {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STAGES: readonly [Stage, Stage, Stage, Stage] = [
  {
    icon: ScanSearch,
    title: 'Analyze',
    body: 'What it can do, and whether the risk is reachable.',
  },
  {
    icon: GitCompareArrows,
    title: 'Compare',
    body: 'What changed, and whether the change was declared.',
  },
  {
    icon: Network,
    title: 'Correlate',
    body: 'Shared maintainers, infrastructure, patterns.',
  },
  {
    icon: Radar,
    title: 'Enrich',
    body: 'Known vulnerabilities and threat intelligence.',
  },
];

const OUTCOMES: readonly { label: string; color: string; icon: LucideIcon }[] = [
  { label: 'Malicious', color: VERDICT.malicious, icon: ShieldAlert },
  { label: 'Uncertain', color: VERDICT.uncertain, icon: ShieldQuestionMark },
  { label: 'Pass', color: VERDICT.pass, icon: ShieldCheck },
];

const STAGE_COUNT = STAGES.length;
/** Phases 0..3 light the stations, 4 reaches the verdict, 5 and 6 hold it. */
const PHASES = STAGE_COUNT + 3;
const STEP_MS = 1150;

/** Station node: the sphere inside a white ring, with the rail through its centre. */
const NODE = 72;
const NODE_RING = 12;
const NODE_BOX = NODE + NODE_RING * 2;
const RAIL_Y = NODE_BOX / 2;

const ACCENT = '#7C4FF0';
const RAIL_FILL = 'linear-gradient(90deg, #9A51FF 0%, #6D6BFF 45%, #33BAEC 100%)';
const SIGNAL_COLORS = ['#9A51FF', '#33BAEC', '#6D6BFF', '#2DD4BF', '#A974FF'] as const;

interface ScanState {
  phase: number;
  outcome: number;
  animated: boolean;
}

const STILL: ScanState = { phase: STAGE_COUNT, outcome: 0, animated: false };

function useVerdictScan(target: React.RefObject<HTMLElement | null>): ScanState {
  const [state, setState] = useState<ScanState>(STILL);

  useEffect(() => {
    const node = target.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | undefined;
    const tick = (): void =>
      setState((s) => {
        const phase = (s.phase + 1) % PHASES;
        return {
          phase,
          outcome: phase === 0 ? (s.outcome + 1) % OUTCOMES.length : s.outcome,
          animated: true,
        };
      });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (timer === undefined) {
            setState((s) => (s.animated ? s : { phase: 0, outcome: 0, animated: true }));
            timer = window.setInterval(tick, STEP_MS);
          }
        } else if (timer !== undefined) {
          window.clearInterval(timer);
          timer = undefined;
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [target]);

  return state;
}

/* ── Stations ─────────────────────────────────────────────────────────────── */

/**
 * A station on the rail: the icon sphere set in a white ring that masks the
 * rail behind it. Stages the scan has reached get a violet ring; the active
 * one pings.
 */
function StationNode({
  stage,
  lit,
  active,
  size,
  ring,
}: {
  stage: Stage;
  lit: boolean;
  active: boolean;
  size: number;
  ring: number;
}): React.ReactElement {
  const box = size + ring * 2;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: box, height: box }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full transition-[box-shadow] duration-500"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F1FD 100%)',
          boxShadow: lit
            ? `inset 0 0 0 1.5px color-mix(in srgb, ${ACCENT} 45%, transparent), 0 12px 26px -12px rgba(76,40,180,0.45)`
            : 'inset 0 0 0 1px rgba(124,79,240,0.16)',
        }}
      />
      {active ? (
        <span
          key="ping"
          aria-hidden
          className="cs-tri-ping absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 0 2px ${ACCENT}` }}
        />
      ) : null}
      <span className="relative">
        <IconSphere icon={stage.icon} size={size} dim={!lit} />
      </span>
    </div>
  );
}

function StageText({
  stage,
  lit,
  align,
}: {
  stage: Stage;
  lit: boolean;
  align: 'center' | 'left';
}): React.ReactElement {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <h3
        className="transition-colors duration-500"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h5)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: lit ? '#111111' : '#8A849C',
          margin: 0,
        }}
      >
        {stage.title}
      </h3>
      <p
        className={`transition-colors duration-500 ${align === 'center' ? 'mx-auto' : ''}`}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          lineHeight: 1.5,
          color: lit ? '#4A4560' : '#9A95AA',
          margin: '6px 0 0',
          maxWidth: '200px',
        }}
      >
        {stage.body}
      </p>
    </div>
  );
}

/* ── Rail ─────────────────────────────────────────────────────────────────── */

/** Signal particles streaming along a rail, horizontally or vertically. */
function SignalStream({ axis }: { axis: 'x' | 'y' }): React.ReactElement {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      {SIGNAL_COLORS.map((color, i) => (
        <span
          key={color}
          className={
            axis === 'x' ? 'cs-tri-signal-x absolute inset-0' : 'cs-tri-signal-y absolute inset-0'
          }
          style={{ animationDelay: `${i * -0.62}s` }}
        >
          <span
            className={`absolute rounded-full ${
              axis === 'x'
                ? 'right-0 top-1/2 h-1.5 w-5 -translate-y-1/2'
                : 'bottom-0 left-1/2 h-5 w-1.5 -translate-x-1/2'
            }`}
            style={{
              background:
                axis === 'x'
                  ? `linear-gradient(90deg, transparent, ${color})`
                  : `linear-gradient(180deg, transparent, ${color})`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </span>
      ))}
    </span>
  );
}

/* ── Verdict ──────────────────────────────────────────────────────────────── */

/** Radio-style marker: empty, or filled in the outcome colour once selected. */
function SelectMark({ color, selected }: { color: string; selected: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-500"
      style={{
        background: selected ? color : '#FFFFFF',
        boxShadow: selected
          ? `0 0 0 4px color-mix(in srgb, ${color} 18%, transparent)`
          : 'inset 0 0 0 1.5px rgba(17,17,17,0.14)',
      }}
    >
      <span
        className="block h-1.5 w-1.5 rounded-full bg-white transition-transform duration-500"
        style={{ transform: selected ? 'scale(1)' : 'scale(0)' }}
      />
    </span>
  );
}

function VerdictCard({ scan }: { scan: ScanState }): React.ReactElement {
  const reached = scan.animated && scan.phase >= STAGE_COUNT;
  return (
    <div
      className="relative overflow-hidden bg-white transition-shadow duration-700"
      style={{
        borderRadius: '24px',
        boxShadow: reached
          ? `0 0 0 1.5px color-mix(in srgb, ${ACCENT} 45%, transparent), 0 24px 48px -24px rgba(76,40,180,0.45)`
          : '0 0 0 1px rgba(124,79,240,0.16), 0 24px 48px -28px rgba(40,30,90,0.25)',
      }}
    >
      <div
        className="flex items-center gap-3 px-5"
        style={{ height: RAIL_Y + 8, borderBottom: '1px solid rgba(124,79,240,0.10)' }}
      >
        <IconSphere icon={ShieldCheck} size={36} />
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h5)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            lineHeight: 1.1,
            color: '#111111',
            margin: 0,
          }}
        >
          VERDICT
        </h3>
      </div>

      <ul className="flex flex-col gap-2 p-3">
        {OUTCOMES.map((o, i) => {
          const selected = reached && scan.outcome === i;
          const Icon = o.icon;
          return (
            <li
              key={o.label}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-[background-color,box-shadow] duration-500"
              style={{
                background: selected ? `color-mix(in srgb, ${o.color} 9%, #FFFFFF)` : 'transparent',
                boxShadow: selected
                  ? `inset 0 0 0 1px color-mix(in srgb, ${o.color} 45%, transparent)`
                  : 'inset 0 0 0 1px transparent',
              }}
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${o.color} 14%, #FFFFFF)`,
                  color: `color-mix(in srgb, ${o.color} 78%, #111111)`,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: '#111111',
                }}
              >
                {o.label}
              </span>
              <SelectMark color={o.color} selected={selected} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Layouts ──────────────────────────────────────────────────────────────── */

/** The white panel the engine is mounted in, with a faint wash across the top. */
function InstrumentPanel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: '32px',
        background: [
          'radial-gradient(55% 70% at 0% 0%, rgba(154,81,255,0.06) 0%, rgba(154,81,255,0) 100%)',
          'radial-gradient(55% 70% at 100% 0%, rgba(47,128,255,0.05) 0%, rgba(47,128,255,0) 100%)',
          '#FFFFFF',
        ].join(', '),
        border: '1px solid rgba(154, 81, 255, 0.14)',
        boxShadow:
          '0 1px 2px rgba(17, 17, 17, 0.04), 0 4px 24px -4px rgba(40, 30, 90, 0.04), 0 24px 56px -28px rgba(40, 30, 90, 0.18)',
      }}
    >
      {children}
    </div>
  );
}

function EngineWide({ scan }: { scan: ScanState }): React.ReactElement {
  // Stations sit at the centres of four equal columns. The rail starts at the
  // first centre (12.5%) and runs on into the verdict card, so each station adds
  // 25 / 87.5 of its length.
  const reached = Math.min(scan.phase, STAGE_COUNT);
  const fill = reached >= STAGE_COUNT ? 100 : (reached * 25 * 100) / 87.5;
  return (
    <div className="hidden items-start gap-10 p-[clamp(28px,3vw,44px)] lg:flex">
      <ol
        className="relative grid flex-1 grid-cols-4 gap-4 pt-2"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        <span
          aria-hidden
          className="absolute h-1.5 rounded-full"
          style={{
            top: RAIL_Y - 3 + 8,
            left: '12.5%',
            right: '-40px',
            background: 'rgba(124,79,240,0.10)',
            boxShadow: 'inset 0 1px 2px rgba(40,20,90,0.12)',
          }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${fill}%`,
              background: RAIL_FILL,
              boxShadow: '0 0 14px rgba(109,107,255,0.55)',
            }}
          />
          {scan.animated ? <SignalStream axis="x" /> : null}
        </span>
        {STAGES.map((stage, i) => {
          const lit = scan.phase >= i;
          const active = scan.animated && scan.phase === i;
          return (
            <li key={stage.title} className="relative flex flex-col items-center">
              <StationNode stage={stage} lit={lit} active={active} size={NODE} ring={NODE_RING} />
              <div className="mt-5">
                <StageText stage={stage} lit={lit} align="center" />
              </div>
            </li>
          );
        })}
      </ol>
      {/* mt-2 lines the card's header up with the rail, which ends in it. */}
      <div className="relative mt-2 w-[clamp(270px,22vw,300px)] shrink-0">
        <VerdictCard scan={scan} />
      </div>
    </div>
  );
}

function EngineStacked({ scan }: { scan: ScanState }): React.ReactElement {
  const reached = Math.min(scan.phase, STAGE_COUNT);
  const fill = (reached / STAGE_COUNT) * 100;
  return (
    <div className="mx-auto max-w-[560px] p-5 sm:p-7 lg:hidden">
      <ol
        className="relative flex flex-col gap-5"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        <span
          aria-hidden
          className="absolute w-1.5 rounded-full"
          style={{ left: 33, top: 36, bottom: -28, background: 'rgba(124,79,240,0.10)' }}
        >
          <span
            className="absolute inset-x-0 top-0 rounded-full transition-[height] duration-700 ease-out"
            style={{
              height: `${fill}%`,
              background: 'linear-gradient(180deg, #9A51FF 0%, #6D6BFF 45%, #33BAEC 100%)',
            }}
          />
          {scan.animated ? <SignalStream axis="y" /> : null}
        </span>
        {STAGES.map((stage, i) => {
          const lit = scan.phase >= i;
          const active = scan.animated && scan.phase === i;
          return (
            <li key={stage.title} className="relative flex items-center gap-4">
              <StationNode stage={stage} lit={lit} active={active} size={52} ring={10} />
              <div className="min-w-0 flex-1">
                <StageText stage={stage} lit={lit} align="left" />
              </div>
            </li>
          );
        })}
      </ol>
      <div className="relative mt-7">
        <VerdictCard scan={scan} />
      </div>
    </div>
  );
}

export function TricorderPipeline(): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const scan = useVerdictScan(root);

  return (
    <section
      data-section="TricorderPipeline"
      className="relative overflow-hidden py-section-md"
      style={{ background: '#EFEDF7' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: '-185px',
          top: '-193px',
          width: '488px',
          height: '496px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '-218px',
          top: '-139px',
          width: '488px',
          height: '496px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto flex max-w-[840px] flex-col items-center gap-4 text-center"
          style={{ marginBottom: 'clamp(36px, 4vw, 56px)' }}
        >
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
                margin: 0,
              }}
            >
              From Signals <span className="cs-text-gradient-impact">to Verdicts.</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.12} y={16}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(17, 17, 17, 0.75)',
                maxWidth: '720px',
                margin: 0,
                textWrap: 'balance',
              }}
            >
              Tricorder puts every component through four steps, adds the context the component
              can’t provide on its own, and resolves to a single verdict.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} y={20}>
          <div ref={root}>
            <InstrumentPanel>
              <EngineWide scan={scan} />
              <EngineStacked scan={scan} />
            </InstrumentPanel>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
