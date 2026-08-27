'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/Reveal';

/*
 * "Risk Enters Long Before Production" — a continuous supply-chain scan.
 *
 * The section argues that risk is introduced upstream, not at deploy. Rather
 * than stating that with six static exhibits, the rail runs a scanner: one
 * light column sweeps left to right through every stage on an infinite loop,
 * surfacing critical/high findings as it crosses each one. The findings persist
 * for the rest of the pass, so by the time the beam lands on Financial
 * Applications the viewer is looking at a full ledger — five flagged inputs and
 * one clean output. Counts change every pass so the rail reads as live
 * instrumentation rather than a printed chart.
 *
 * Timing architecture: the beam's own CSS animation is the only clock. An 80ms
 * poll reads its `currentTime` to derive the active stage and the pass number,
 * so the readout can never drift from the beam the way two independent timers
 * would, and background-tab throttling self-corrects on the next poll instead
 * of accumulating. Findings are derived from the pass number through a pure
 * hash, so pass 0 renders identically on the server and the client (no
 * `Math.random()` in render, no hydration mismatch). Reduced motion drops the
 * beam entirely and shows the settled ledger.
 */

const STAGE_COUNT = 6;
const CYCLE_MS = 10_200;
/** 80ms puts the crossing detection inside ~10px of the beam at 1440. */
const POLL_MS = 80;
/** How close (in column widths) the beam must be for a stage to light up. */
const LIT_WINDOW = 0.4;

interface StageDef {
  id: string;
  line1: string;
  line2: string;
  /** Inclusive count bands. The terminal stage carries none — it is the clean output. */
  critical?: readonly [number, number];
  high?: readonly [number, number];
  terminal?: boolean;
}

const STAGES: readonly StageDef[] = [
  {
    id: 'open-source',
    line1: 'Open Source',
    line2: 'Components',
    critical: [2, 6],
    high: [6, 14],
  },
  {
    id: 'dependencies',
    line1: 'Libraries &',
    line2: 'Dependencies',
    critical: [3, 9],
    high: [8, 19],
  },
  {
    id: 'containers',
    line1: 'Container',
    line2: 'Images',
    critical: [4, 11],
    high: [10, 24],
  },
  {
    id: 'ai-code',
    line1: 'AI-Generated',
    line2: 'Code',
    critical: [1, 5],
    high: [4, 11],
  },
  {
    id: 'pipeline',
    line1: 'Build & Delivery',
    line2: 'Pipeline',
    critical: [1, 4],
    high: [3, 8],
  },
  {
    id: 'financial-apps',
    line1: 'Financial',
    line2: 'Applications',
    terminal: true,
  },
];

/* -------------------------------------------------------------------------- */
/*                          DETERMINISTIC PASS COUNTS                         */
/* -------------------------------------------------------------------------- */

/** 32-bit integer hash. Two ints in, one well-mixed uint out. */
function hash2(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b1, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 13), 0x297a2d39);
  return (h ^ (h >>> 16)) >>> 0;
}

function pickInBand(
  pass: number,
  stageIndex: number,
  salt: number,
  band: readonly [number, number],
): number {
  const [min, max] = band;
  return min + (hash2(pass * 977 + salt, stageIndex + 7) % (max - min + 1));
}

interface StageFindings {
  critical: number;
  high: number;
}

function findingsForPass(pass: number): readonly StageFindings[] {
  return STAGES.map((stage, i) => ({
    critical: stage.critical ? pickInBand(pass, i, 1, stage.critical) : 0,
    high: stage.high ? pickInBand(pass, i, 2, stage.high) : 0,
  }));
}

/* -------------------------------------------------------------------------- */
/*                                SCAN CLOCK                                  */
/* -------------------------------------------------------------------------- */

interface ScanState {
  /** Stages whose centre the beam has already crossed. Drives findings. */
  revealedCount: number;
  /** Stage the beam is currently over. Drives the lift and halo. */
  litIndex: number;
  pass: number;
}

const IDLE_SCAN: ScanState = { revealedCount: 0, litIndex: -1, pass: 0 };

/**
 * Derives scan state straight from the beam's own animation, so the readout can
 * never drift from what the visitor sees.
 *
 * Everything keys off the artifact's centre, not its grid column. Column-edge
 * triggering fires half a column early, which puts the findings on screen while
 * the beam is still visibly short of the object.
 */
function useScanClock(enabled: boolean): {
  beamRef: React.RefObject<HTMLDivElement | null>;
  scan: ScanState;
} {
  const beamRef = useRef<HTMLDivElement | null>(null);
  const [scan, setScan] = useState<ScanState>(IDLE_SCAN);

  useEffect(() => {
    if (!enabled) return;

    const startedAt = performance.now();
    let previous: ScanState = IDLE_SCAN;

    const read = (): void => {
      const raw = beamRef.current?.getAnimations()[0]?.currentTime;
      // Every browser returns a plain number here; the wall clock covers the
      // CSSNumericValue case rather than casting through it.
      const elapsed = typeof raw === 'number' ? raw : performance.now() - startedAt;

      const pass = Math.floor(elapsed / CYCLE_MS);
      // Beam position in column widths: stage i's centre sits at i + 0.5.
      const position = ((elapsed % CYCLE_MS) / CYCLE_MS) * STAGE_COUNT;

      const revealedCount = Math.min(STAGE_COUNT, Math.max(0, Math.floor(position + 0.5)));

      const nearest = Math.round(position - 0.5);
      const litIndex =
        nearest >= 0 && nearest < STAGE_COUNT && Math.abs(position - (nearest + 0.5)) < LIT_WINDOW
          ? nearest
          : -1;

      if (
        revealedCount !== previous.revealedCount ||
        litIndex !== previous.litIndex ||
        pass !== previous.pass
      ) {
        previous = { revealedCount, litIndex, pass };
        setScan(previous);
      }
    };

    read();
    const id = window.setInterval(read, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);

  return { beamRef, scan };
}

/* -------------------------------------------------------------------------- */
/*                              SEVERITY GLYPH                                */
/* -------------------------------------------------------------------------- */

type Severity = 'critical' | 'high';

const SEVERITY: Record<Severity, { color: string; ink: string }> = {
  critical: { color: '#FF6B6B', ink: '#3A0B14' },
  high: { color: '#FFC24B', ink: '#3D2705' },
};

/*
 * The warning triangle, drawn rather than dotted. A coloured dot is a legend
 * swatch: it says "this category" and nothing more. The triangle is the glyph
 * every scanner, IDE and CVE dashboard already uses for a finding, so it reads
 * as a defect on the component without needing a key.
 *
 * Corners come from `strokeLinejoin: round` on a stroked-and-filled path rather
 * than from arc commands — at 13px a hand-authored rounded triangle is all
 * rounding and no triangle, while a 2-unit round join keeps the silhouette.
 *
 * `detail` carries the exclamation. It holds at pip size and turns to mud in the
 * 10px readout swatch, where the solid silhouette reads better on its own.
 */
function SeverityGlyph({
  severity,
  size,
  detail,
}: {
  severity: Severity;
  size: number;
  detail: boolean;
}): React.ReactElement {
  const { color, ink } = SEVERITY[severity];

  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d="M10 2.6 L18 15.6 H2 Z"
        fill={color}
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {detail ? (
        <>
          <path d="M10 7.4 V10.9" stroke={ink} strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="13.3" r="1.15" fill={ink} />
        </>
      ) : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                              COUNT-UP READOUT                              */
/* -------------------------------------------------------------------------- */

const COUNT_UP_MS = 520;

function FindingCount({
  value,
  label,
  tone,
  revealed,
  animated,
}: {
  value: number;
  label: string;
  tone: 'critical' | 'high' | 'clear';
  revealed: boolean;
  animated: boolean;
}): React.ReactElement {
  const [shown, setShown] = useState<number>(0);

  useEffect(() => {
    if (!revealed) {
      setShown(0);
      return;
    }
    if (!animated || value === 0) {
      setShown(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - startedAt) / COUNT_UP_MS);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, revealed, animated]);

  const color = tone === 'clear' ? '#5FE3C0' : SEVERITY[tone].color;

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {/* The clear state keeps a dot on purpose. It is not a lesser severity,
          it is the absence of one, so it should not wear the warning glyph. */}
      {tone === 'clear' ? (
        <span
          aria-hidden
          className="inline-block shrink-0 rounded-full"
          style={{
            width: '6px',
            height: '6px',
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ) : (
        <span
          aria-hidden
          className="inline-flex shrink-0"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}
        >
          <SeverityGlyph severity={tone} size={10} detail={false} />
        </span>
      )}
      <span style={{ color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{shown}</span>
      <span style={{ color: 'rgba(255,255,255,0.62)' }}>{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                     UNIFIED 3D PODIUM BASE COMPONENT                       */
/* -------------------------------------------------------------------------- */

/** 3D stepped cylindrical showcase base (rendered at bottom of SVG, y: 104..134). */
function BasePodium({ terminal, lit }: { terminal?: boolean; lit: boolean }): React.ReactElement {
  return (
    <g className="select-none">
      {/* 1. Floor ambient glow spread */}
      <ellipse
        cx="70"
        cy="124"
        rx={terminal ? '68' : '64'}
        ry="12"
        fill={terminal ? 'rgba(44, 193, 235, 0.45)' : 'rgba(154, 81, 255, 0.28)'}
        filter="blur(6px)"
      />

      {/* 2. Concentric security shield ring (terminal exclusive) */}
      {terminal ? (
        <ellipse
          cx="70"
          cy="124"
          rx="68"
          ry="13"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          opacity={lit ? '1' : '0.75'}
          className="cs-shield-ring"
        />
      ) : null}

      {/* 3. 3D stepped cylinder base body */}
      <path
        d={
          terminal
            ? 'M8,110 C8,119 36,126 70,126 C104,126 132,119 132,110 L132,118 C132,127 104,134 70,134 C36,134 8,127 8,118 Z'
            : 'M10,110 C10,118 37,125 70,125 C103,125 130,118 130,110 L130,117 C130,125 103,132 70,132 C37,132 10,125 10,117 Z'
        }
        fill="url(#podium-base-grad)"
        stroke={terminal ? '#38BDF8' : '#A5B4FC'}
        strokeWidth="0.8"
      />

      {/* 4. Top reflective glass/metal stage surface */}
      <ellipse
        cx="70"
        cy="110"
        rx={terminal ? '64' : '60'}
        ry={terminal ? '14' : '13'}
        fill={terminal ? '#E0F7FE' : '#FFFFFF'}
        stroke="url(#podium-rim-grad)"
        strokeWidth={lit ? '2.2' : '1.4'}
      />

      {/* 5. Inner concentric refraction bevel */}
      <ellipse
        cx="70"
        cy="110"
        rx={terminal ? '50' : '46'}
        ry={terminal ? '10' : '9'}
        fill={terminal ? 'rgba(44, 193, 235, 0.28)' : 'rgba(99, 102, 241, 0.14)'}
      />

      {/* 6. Object contact shadow */}
      <ellipse
        cx="70"
        cy="109"
        rx={terminal ? '42' : '36'}
        ry={terminal ? '8' : '7'}
        fill="rgba(15, 23, 42, 0.45)"
        filter="blur(2px)"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*                         STAGE MICRO-SCENE SVGS                             */
/* -------------------------------------------------------------------------- */

const SCENE_CLASS = 'h-full w-full overflow-visible select-none';

function liftStyle(lit: boolean): React.CSSProperties {
  return { transform: lit ? 'translateY(-4px)' : 'none' };
}

/** 01: Open Source — 3D box with floating code cubes. */
function SceneOpenSource({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className={SCENE_CLASS} fill="none" aria-hidden="true">
      <BasePodium lit={lit} />

      <g className="transition-transform duration-500" style={liftStyle(lit)}>
        <polygon points="70,58 98,72 70,86 42,72" fill="#2E1065" />
        <ellipse cx="70" cy="72" rx="20" ry="8" fill="#C084FC" opacity="0.6" />

        <g className="cs-cube-float-1">
          <polygon points="70,30 78,34 70,38 62,34" fill="#BFDBFE" />
          <polygon points="62,34 70,38 70,47 62,43" fill="#3B82F6" />
          <polygon points="70,38 78,34 78,43 70,47" fill="#1D4ED8" />
        </g>

        <g className="cs-cube-float-2">
          <polygon points="48,38 55,42 48,46 41,42" fill="#E2E8F0" />
          <polygon points="41,42 48,46 48,54 41,50" fill="#94A3B8" />
          <polygon points="48,46 55,42 55,50 48,54" fill="#64748B" />
        </g>

        <g className="cs-cube-float-3">
          <polygon points="92,38 99,42 92,46 85,42" fill="#60A5FA" />
          <polygon points="85,42 92,46 92,54 85,50" fill="#2563EB" />
          <polygon points="92,46 99,42 99,50 92,54" fill="#1E40AF" />
        </g>

        <polygon
          points="42,72 70,86 70,108 42,94"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
        <polygon
          points="70,86 98,72 98,94 70,108"
          fill="#E2E8F0"
          stroke="#94A3B8"
          strokeWidth="1"
        />
        <polygon points="42,72 26,64 54,58 70,65" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <polygon
          points="98,72 114,64 86,58 70,65"
          fill="#CBD5E1"
          stroke="#94A3B8"
          strokeWidth="1"
        />

        <text
          x="56"
          y="96"
          fill="#2563EB"
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          &lt;/&gt;
        </text>
        <text
          x="84"
          y="96"
          fill="#1D4ED8"
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          &lt;/&gt;
        </text>
      </g>
    </svg>
  );
}

/** 02: Libraries & Dependencies — multi-tiered slabs. */
function SceneDependencies({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className={SCENE_CLASS} fill="none" aria-hidden="true">
      <BasePodium lit={lit} />

      <g className="transition-transform duration-500" style={liftStyle(lit)}>
        <polygon
          points="70,78 104,90 70,102 36,90"
          fill="#FFFFFF"
          stroke="#94A3B8"
          strokeWidth="1.2"
        />
        <polygon points="36,90 70,102 70,108 36,96" fill="#64748B" />
        <polygon points="70,102 104,90 104,96 70,108" fill="#475569" />

        <line
          x1="46"
          y1="88"
          x2="58"
          y2="81"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeDasharray="3 2"
        />
        <line
          x1="94"
          y1="88"
          x2="82"
          y2="81"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeDasharray="3 2"
        />

        <polygon
          points="70,62 96,72 70,82 44,72"
          fill="#1E293B"
          stroke="#38BDF8"
          strokeWidth="1.4"
        />
        <polygon points="44,72 70,82 70,88 44,78" fill="#0F172A" />
        <polygon points="70,82 96,72 96,78 70,88" fill="#090D16" />

        <polygon points="70,38 80,43 70,48 60,43" fill="#60A5FA" />
        <polygon points="60,43 70,48 70,59 60,54" fill="#2563EB" />
        <polygon points="70,48 80,43 80,54 70,59" fill="#1D4ED8" />

        <polygon points="50,50 56,53 50,56 44,53" fill="#93C5FD" />
        <polygon points="44,53 50,56 50,63 44,60" fill="#3B82F6" />
        <polygon points="50,56 56,53 56,60 50,63" fill="#1E40AF" />

        <polygon points="90,50 96,53 90,56 84,53" fill="#93C5FD" />
        <polygon points="84,53 90,56 90,63 84,60" fill="#3B82F6" />
        <polygon points="90,56 96,53 96,60 90,63" fill="#1E40AF" />
      </g>
    </svg>
  );
}

/** 03: Container Images — hardened shipping container. */
function SceneContainers({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className={SCENE_CLASS} fill="none" aria-hidden="true">
      <BasePodium lit={lit} />

      <g className="transition-transform duration-500" style={liftStyle(lit)}>
        <polygon
          points="70,44 100,56 70,68 40,56"
          fill="#3B82F6"
          stroke="#60A5FA"
          strokeWidth="1.2"
        />
        <line x1="52" y1="52" x2="82" y2="64" stroke="#1D4ED8" strokeWidth="1.5" />
        <line x1="60" y1="48" x2="90" y2="60" stroke="#1D4ED8" strokeWidth="1.5" />

        <polygon
          points="40,56 70,68 70,108 40,96"
          fill="#2563EB"
          stroke="#60A5FA"
          strokeWidth="1.2"
        />
        <line x1="48" y1="59" x2="48" y2="99" stroke="#1E40AF" strokeWidth="2" />
        <line x1="55" y1="62" x2="55" y2="102" stroke="#1E40AF" strokeWidth="2" />
        <line x1="62" y1="65" x2="62" y2="105" stroke="#1E40AF" strokeWidth="2" />

        <polygon
          points="70,68 100,56 100,96 70,108"
          fill="#1D4ED8"
          stroke="#60A5FA"
          strokeWidth="1.2"
        />

        <g transform="translate(85 80)">
          <circle
            cx="0"
            cy="0"
            r="10"
            stroke="#93C5FD"
            strokeWidth="1.8"
            fill="rgba(15, 23, 42, 0.7)"
          />
          <circle cx="0" cy="0" r="4.5" fill="#60A5FA" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect
              key={angle}
              x="-1.5"
              y="-12"
              width="3"
              height="3.5"
              rx="0.5"
              fill="#93C5FD"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** 04: AI-Generated Code — sleek dark IDE screen. */
function SceneAICode({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className={SCENE_CLASS} fill="none" aria-hidden="true">
      <BasePodium lit={lit} />

      <g className="transition-transform duration-500" style={liftStyle(lit)}>
        <rect
          x="34"
          y="38"
          width="72"
          height="66"
          rx="7"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="1.5"
        />

        <line x1="34" y1="48" x2="106" y2="48" stroke="#1E293B" strokeWidth="1" />
        <circle cx="40" cy="43" r="1.8" fill="#EF4444" />
        <circle cx="46" cy="43" r="1.8" fill="#F59E0B" />
        <circle cx="52" cy="43" r="1.8" fill="#10B981" />

        <line
          x1="40"
          y1="56"
          x2="60"
          y2="56"
          stroke="#A855F7"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="64"
          y1="56"
          x2="82"
          y2="56"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="46"
          y1="64"
          x2="76"
          y2="64"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="79"
          y1="64"
          x2="94"
          y2="64"
          stroke="#F59E0B"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="46"
          y1="72"
          x2="68"
          y2="72"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="72"
          y1="72"
          x2="88"
          y2="72"
          stroke="#EC4899"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="80"
          x2="54"
          y2="80"
          stroke="#A855F7"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        <rect x="58" y="78" width="2" height="4.5" fill="#38BDF8" className="cs-cursor-blink" />

        <g transform="translate(82 72)">
          <polygon points="18,9 29,15 18,21 7,15" fill="#60A5FA" stroke="#93C5FD" strokeWidth="1" />
          <polygon points="7,15 18,21 18,34 7,28" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
          <polygon
            points="18,21 29,15 29,28 18,34"
            fill="#1D4ED8"
            stroke="#60A5FA"
            strokeWidth="1"
          />
          <text x="13" y="26" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="monospace">
            &lt;/&gt;
          </text>
        </g>
      </g>
    </svg>
  );
}

/** 05: Build & Delivery Pipeline — CI/CD verification gate. */
function ScenePipeline({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className={SCENE_CLASS} fill="none" aria-hidden="true">
      <BasePodium lit={lit} />

      <g className="transition-transform duration-500" style={liftStyle(lit)}>
        <polygon
          points="70,68 106,82 70,96 34,82"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="1.2"
        />
        <polygon points="34,82 70,96 70,104 34,90" fill="#090D16" />
        <polygon points="70,96 106,82 106,90 70,104" fill="#060911" />

        <line
          x1="44"
          y1="80"
          x2="80"
          y2="94"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
        <line
          x1="60"
          y1="72"
          x2="96"
          y2="86"
          stroke="#9A51FF"
          strokeWidth="2"
          strokeDasharray="3 2"
        />

        <polygon
          points="40,36 46,32 46,74 40,78"
          fill="#1E293B"
          stroke="#38BDF8"
          strokeWidth="1.2"
        />
        <line x1="43" y1="36" x2="43" y2="74" stroke="#38BDF8" strokeWidth="1.5" />

        <polygon
          points="94,32 100,36 100,78 94,74"
          fill="#1E293B"
          stroke="#9A51FF"
          strokeWidth="1.2"
        />
        <line x1="97" y1="36" x2="97" y2="74" stroke="#9A51FF" strokeWidth="1.5" />

        <polygon
          points="40,36 94,32 100,36 46,40"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="1.2"
        />
        <circle cx="70" cy="36" r="3.5" fill="#38BDF8" filter="drop-shadow(0 0 6px #38BDF8)" />
        <circle cx="70" cy="36" r="1.5" fill="#FFFFFF" />

        <polygon
          points="46,40 94,36 94,74 46,78"
          fill="#38BDF8"
          fillOpacity="0.12"
          stroke="#38BDF8"
          strokeWidth="0.8"
          strokeDasharray="2 3"
        />

        <g transform="translate(36 56)">
          <polygon points="10,0 20,5 10,10 0,5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.8" />
          <polygon points="0,5 10,10 10,19 0,14" fill="#94A3B8" />
          <polygon points="10,10 20,5 20,14 10,19" fill="#64748B" />
          <text
            x="10"
            y="16"
            fill="#3B82F6"
            fontSize="5"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            &lt;/&gt;
          </text>
        </g>

        <g transform="translate(62 48)">
          <ellipse
            cx="14"
            cy="28"
            rx="16"
            ry="6"
            fill="rgba(44, 193, 235, 0.4)"
            filter="blur(3px)"
          />
          <polygon points="14,0 28,7 14,14 0,7" fill="#60A5FA" stroke="#93C5FD" strokeWidth="1" />
          <polygon points="0,7 14,14 14,29 0,22" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
          <polygon
            points="14,14 28,7 28,22 14,29"
            fill="#1D4ED8"
            stroke="#3B82F6"
            strokeWidth="1"
          />
          <path
            d="M4,15 L8,19 L19,10"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <g transform="translate(21 16)">
            <circle cx="0" cy="0" r="4.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <path d="M-1.5,-1.5 L1.5,-1.5 L1.5,1.5 L-1.5,1.5 Z" fill="#38BDF8" />
          </g>
        </g>

        <g transform="translate(40 98)">
          <circle cx="10" cy="0" r="2.5" fill="#38BDF8" />
          <circle cx="30" cy="0" r="2.5" fill="#9A51FF" />
          <circle cx="50" cy="0" r="2.5" fill="#22C55E" />
          <line
            x1="13"
            y1="0"
            x2="27"
            y2="0"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeDasharray="1 1"
          />
          <line
            x1="33"
            y1="0"
            x2="47"
            y2="0"
            stroke="#9A51FF"
            strokeWidth="1"
            strokeDasharray="1 1"
          />
        </g>
      </g>
    </svg>
  );
}

/** 06: Financial Applications — the clean output terminal. */
function SceneFinancialApps({ lit }: { lit: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className={SCENE_CLASS} fill="none" aria-hidden="true">
      <BasePodium terminal lit={lit} />

      {/*
       * Scales about the podium surface (70, 110), not the viewBox origin. An
       * SVG transform defaults to origin 0 0, so a bare scale(1.04) shifts every
       * coordinate outward in proportion to its distance from the top-left —
       * the monitor slid right and its stand pulled away from the base.
       *
       * No lift here either, unlike the other five scenes. Those hold floating
       * objects, so translateY reads as hover. This one stands on a plinth, and
       * raising it just detaches the stand from the surface it rests on. Growing
       * from the base reads as the terminal coming to attention instead.
       */}
      <g
        className="transition-transform duration-500"
        style={{
          transformBox: 'view-box',
          transformOrigin: '70px 110px',
          transform: lit ? 'scale(1.05)' : 'none',
        }}
      >
        <ellipse
          cx="70"
          cy="107"
          rx="24"
          ry="5.5"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="1.4"
        />
        <rect
          x="68"
          y="92"
          width="4.5"
          height="15"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="1"
        />

        <rect
          x="22"
          y="26"
          width="96"
          height="68"
          rx="9"
          fill="#061024"
          stroke="#2CC1EB"
          strokeWidth="2.2"
        />

        <line x1="22" y1="36" x2="118" y2="36" stroke="rgba(44, 193, 235, 0.4)" strokeWidth="1" />
        <circle cx="30" cy="31" r="2" fill="#2CC1EB" />
        <circle cx="36" cy="31" r="2" fill="#2CC1EB" opacity="0.65" />
        <circle cx="42" cy="31" r="2" fill="#2CC1EB" opacity="0.35" />

        <path d="M30,64 Q42,46 56,56 T80,46 L80,72 L30,72 Z" fill="#38BDF8" fillOpacity="0.35" />
        <path
          d="M30,64 Q42,46 56,56 T80,46"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        <g fill="#2CC1EB">
          <rect x="30" y="77" width="5" height="11" rx="1" />
          <rect x="39" y="73" width="5" height="15" rx="1" />
          <rect x="48" y="79" width="5" height="9" rx="1" />
          <rect x="57" y="69" width="5" height="19" rx="1" />
        </g>

        <g transform="translate(98 56)">
          <circle cx="0" cy="0" r="12" stroke="#1E293B" strokeWidth="3.6" />
          <circle
            cx="0"
            cy="0"
            r="12"
            stroke="#2CC1EB"
            strokeWidth="3.6"
            strokeDasharray="56 70"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="5" fill="rgba(44, 193, 235, 0.3)" />
        </g>

        <g transform="translate(98 80)">
          <rect
            x="-14"
            y="-6"
            width="28"
            height="12"
            rx="4"
            fill="rgba(44, 193, 235, 0.25)"
            stroke="#2CC1EB"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="2.5"
            fill="#A6ECFF"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            100% SLSA
          </text>
        </g>
      </g>
    </svg>
  );
}

function renderScene(id: string, lit: boolean): React.ReactElement {
  switch (id) {
    case 'dependencies':
      return <SceneDependencies lit={lit} />;
    case 'containers':
      return <SceneContainers lit={lit} />;
    case 'ai-code':
      return <SceneAICode lit={lit} />;
    case 'pipeline':
      return <ScenePipeline lit={lit} />;
    case 'financial-apps':
      return <SceneFinancialApps lit={lit} />;
    default:
      return <SceneOpenSource lit={lit} />;
  }
}

/* -------------------------------------------------------------------------- */
/*                            FINDING MARKER PIPS                             */
/* -------------------------------------------------------------------------- */

/*
 * Candidate slots that hug the artifact silhouette rather than the edges of the
 * box, so markers read as findings sitting on the component instead of
 * decoration floating around it. Both pools stop above the podium: a triangle
 * below y≈65% collides with the plinth.
 *
 * Each stage draws its markers from these pools rather than using a fixed set.
 * A fixed set made all six stages identical stamps — same positions, same
 * marker count — which read as wallpaper and quietly contradicted the numbers
 * underneath. Critical stays biased left and high right so the two clusters
 * remain separable at a glance, but which slots get used varies by stage and by
 * pass.
 */
const CRITICAL_SLOTS: readonly { x: string; y: string }[] = [
  { x: '19%', y: '50%' },
  { x: '27%', y: '30%' },
  { x: '13%', y: '37%' },
  { x: '35%', y: '18%' },
  { x: '24%', y: '61%' },
  { x: '38%', y: '38%' },
  { x: '11%', y: '24%' },
];
const HIGH_SLOTS: readonly { x: string; y: string }[] = [
  { x: '81%', y: '47%' },
  { x: '73%', y: '29%' },
  { x: '89%', y: '35%' },
  { x: '65%', y: '19%' },
  { x: '77%', y: '60%' },
  { x: '62%', y: '37%' },
  { x: '87%', y: '22%' },
];

const SLOTS: Record<Severity, readonly { x: string; y: string }[]> = {
  critical: CRITICAL_SLOTS,
  high: HIGH_SLOTS,
};

/*
 * Findings per marker. Marker count tracks the reported number instead of
 * saturating at a cap, so Container Images visibly carries more triangles than
 * Build & Delivery — which is the whole point the section is making.
 */
const FINDINGS_PER_MARKER: Record<Severity, number> = { critical: 3, high: 5 };
const MAX_MARKERS = 5;
const PIP_SIZE = 13;

/** Deterministic sample without replacement. Same seed, same draw. */
function drawSlots(
  pool: readonly { x: string; y: string }[],
  take: number,
  seed: number,
): { x: string; y: string }[] {
  const remaining = [...pool];
  const drawn: { x: string; y: string }[] = [];

  for (let i = 0; i < take && remaining.length > 0; i += 1) {
    const [slot] = remaining.splice(hash2(seed, i) % remaining.length, 1);
    if (slot) drawn.push(slot);
  }

  return drawn;
}

function FindingPips({
  count,
  severity,
  stageIndex,
  pass,
  visible,
  animated,
  delayOffset,
}: {
  count: number;
  severity: Severity;
  stageIndex: number;
  pass: number;
  visible: boolean;
  animated: boolean;
  delayOffset: number;
}): React.ReactElement {
  const { color } = SEVERITY[severity];
  const seed = hash2(pass * 31 + stageIndex, severity === 'critical' ? 11 : 23);
  // Floor of one marker for any non-zero count, so a single finding still shows
  // up. Zero has to short-circuit rather than lean on that floor: no band starts
  // at zero today, but one that did would otherwise mark a clean component.
  const markers =
    count > 0
      ? Math.max(1, Math.min(MAX_MARKERS, Math.ceil(count / FINDINGS_PER_MARKER[severity])))
      : 0;

  return (
    <>
      {drawSlots(SLOTS[severity], markers, seed).map((anchor, i) => {
        // A point of size jitter either way. Identical glyphs at identical
        // scale look stamped however well they are placed.
        const size = PIP_SIZE + (hash2(seed, i + 41) % 3) - 1;

        return (
          <span
            key={anchor.x + anchor.y}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: anchor.x,
              top: anchor.y,
              marginLeft: `${-size / 2}px`,
              marginTop: `${-(size * 0.9) / 2}px`,
              // Glow via drop-shadow, which follows the triangle's outline. The
              // dot's box-shadow ring would have haloed a square around it.
              filter: `drop-shadow(0 0 7px ${color}) drop-shadow(0 1px 2px rgba(10,6,26,0.55))`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.4)',
              transition: animated
                ? `opacity 200ms ease-out ${delayOffset + i * 70}ms, transform 240ms cubic-bezier(0.34,1.56,0.64,1) ${delayOffset + i * 70}ms`
                : 'none',
            }}
          >
            <SeverityGlyph severity={severity} size={size} detail />
          </span>
        );
      })}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              LOCK-ON BRACKETS                              */
/* -------------------------------------------------------------------------- */

/*
 * Four corner brackets that snap around the artifact while the beam is on it.
 * This is the one gesture that reads unambiguously as an instrument acquiring a
 * target, and unlike a glow or a shimmer it carries meaning: it says the machine
 * has singled this component out, which is exactly what the findings underneath
 * are about to report.
 *
 * Timing is deliberately short and tight. Anything that eases in over 400ms
 * reads as a UI transition; a scanner locks.
 */
const BRACKET_CORNERS: readonly {
  key: string;
  position: React.CSSProperties;
  offset: string;
}[] = [
  {
    key: 'tl',
    position: { left: 0, top: 0, borderLeftWidth: 1.5, borderTopWidth: 1.5 },
    offset: 'translate(-7px, -7px)',
  },
  {
    key: 'tr',
    position: { right: 0, top: 0, borderRightWidth: 1.5, borderTopWidth: 1.5 },
    offset: 'translate(7px, -7px)',
  },
  {
    key: 'bl',
    position: { left: 0, bottom: 0, borderLeftWidth: 1.5, borderBottomWidth: 1.5 },
    offset: 'translate(-7px, 7px)',
  },
  {
    key: 'br',
    position: { right: 0, bottom: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5 },
    offset: 'translate(7px, 7px)',
  },
];

function LockOnBrackets({
  visible,
  animated,
  color,
}: {
  visible: boolean;
  animated: boolean;
  color: string;
}): React.ReactElement {
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ inset: '7%' }}>
      {BRACKET_CORNERS.map((corner, i) => (
        <span
          key={corner.key}
          className="absolute block"
          style={{
            ...corner.position,
            width: '15px',
            height: '15px',
            borderStyle: 'solid',
            borderColor: color,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translate(0, 0)' : corner.offset,
            transition: animated
              ? `opacity 110ms linear ${i * 22}ms, transform 150ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 22}ms`
              : 'none',
          }}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STAGE NODE                                    */
/* -------------------------------------------------------------------------- */

function StageNode({
  stage,
  stageIndex,
  pass,
  lit,
  revealed,
  findings,
  animated,
}: {
  stage: StageDef;
  stageIndex: number;
  /** Reseeds marker placement each sweep, so no two passes look alike. */
  pass: number;
  /** Beam is over this artifact right now. */
  lit: boolean;
  /** Beam has crossed this artifact's centre — findings are on the board. */
  revealed: boolean;
  findings: StageFindings;
  animated: boolean;
}): React.ReactElement {
  const { line1, line2, terminal } = stage;
  const awake = lit || revealed;

  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Scene stage — desaturated until the beam is on it, then held lit. */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 'var(--scan-scene)',
          height: 'var(--scan-scene)',
          filter: awake ? 'saturate(1) brightness(1)' : 'saturate(0.4) brightness(0.72)',
          opacity: awake ? 1 : 0.62,
          transition: animated ? 'filter 320ms ease-out, opacity 320ms ease-out' : 'none',
        }}
      >
        {/* Mobile scan sweep — the beam is desktop-only, so the active card
            carries its own pass of light at narrow widths. */}
        {lit ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden"
            style={{ borderRadius: '18px' }}
          >
            <span className="cs-card-sweep absolute inset-y-0 w-1/2" />
          </span>
        ) : null}

        {/* Scanning halo — marks which stage the instrument is on. */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '78%',
            height: '78%',
            background: terminal
              ? 'radial-gradient(closest-side, rgba(44,193,235,0.30) 0%, rgba(44,193,235,0) 72%)'
              : 'radial-gradient(closest-side, rgba(154,81,255,0.32) 0%, rgba(154,81,255,0) 72%)',
            opacity: lit ? 1 : 0,
            transition: animated ? 'opacity 420ms ease-out' : 'none',
          }}
        />

        <div className="relative h-full w-full">{renderScene(stage.id, lit)}</div>

        <LockOnBrackets
          visible={lit}
          animated={animated}
          color={terminal ? '#5FE3C0' : '#7FE3FF'}
        />

        {terminal ? (
          <span
            aria-hidden
            className="pointer-events-none absolute flex items-center justify-center rounded-full"
            style={{
              left: '15%',
              top: '22%',
              width: '26px',
              height: '26px',
              marginLeft: '-13px',
              marginTop: '-13px',
              background: '#0B1F2E',
              border: '1.5px solid #5FE3C0',
              boxShadow: '0 0 14px rgba(95, 227, 192, 0.75)',
              color: '#5FE3C0',
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'scale(1)' : 'scale(0.4)',
              transition: animated
                ? 'opacity 220ms ease-out 40ms, transform 260ms cubic-bezier(0.34,1.56,0.64,1) 40ms'
                : 'none',
            }}
          >
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
              <path
                d="M1 5L4.6 8.6L12 1.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          <>
            <FindingPips
              count={findings.critical}
              severity="critical"
              stageIndex={stageIndex}
              pass={pass}
              visible={revealed}
              animated={animated}
              delayOffset={0}
            />
            <FindingPips
              count={findings.high}
              severity="high"
              stageIndex={stageIndex}
              pass={pass}
              visible={revealed}
              animated={animated}
              delayOffset={70}
            />
          </>
        )}
      </div>

      {/* Stage label */}
      <h3
        style={{
          marginTop: 'clamp(10px, 1vw, 16px)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h5)',
          fontWeight: terminal ? 700 : 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.25,
          color: terminal ? '#7FE3FF' : lit ? '#FFFFFF' : revealed ? '#DEDBF1' : '#A9A3C9',
          textShadow: terminal
            ? '0 0 20px rgba(56, 189, 248, 0.7)'
            : lit
              ? '0 0 16px rgba(179, 107, 255, 0.85)'
              : 'none',
          transition: animated ? 'color 400ms ease-out' : 'none',
        }}
      >
        <span className="block">{line1}</span>
        <span className="block">{line2}</span>
      </h3>

      {/* Findings readout — height is reserved so nothing shifts as it fills. */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
        style={{
          marginTop: '10px',
          minHeight: '20px',
          fontFamily: 'var(--font-sans)',
          fontSize: '12.5px',
          letterSpacing: '-0.01em',
          opacity: revealed ? 1 : 0,
          transition: animated ? 'opacity 320ms ease-out' : 'none',
        }}
      >
        {terminal ? (
          <FindingCount
            value={0}
            label="findings"
            tone="clear"
            revealed={revealed}
            animated={false}
          />
        ) : (
          <>
            <FindingCount
              value={findings.critical}
              label="critical"
              tone="critical"
              revealed={revealed}
              animated={animated}
            />
            <FindingCount
              value={findings.high}
              label="high"
              tone="high"
              revealed={revealed}
              animated={animated}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SCAN RAIL + BEAM                              */
/* -------------------------------------------------------------------------- */

/*
 * The traveller is a full-width wrapper animating translateX(-100% -> 0). Its
 * right edge is therefore the beam head, sweeping the container's left edge to
 * its right edge in pure percentages — no measured pixel width, so it stays
 * correct through every breakpoint and container resize. Everything hanging off
 * that right edge (head, trail, swept rail fill) follows for free.
 *
 * The column is built as a light source rather than a line with a glow. Four
 * stacked strips give the horizontal falloff (wide haze, flare, inner glow,
 * hairline core) and a single shared mask gives the vertical profile, so the
 * two axes stay independently tunable. A `box-shadow` cannot do this: its blur
 * is isotropic, which puts a soft rectangle of even light around the line and
 * is the thing that makes a beam read as pasted on.
 *
 * The profile peaks at 55% rather than centre, which is where the rail crosses
 * once labels and readouts are counted into the row height. Light is brightest
 * where it meets the floor, tapers long through the artifact above it, and dies
 * short below into the labels.
 */
const BEAM_PROFILE =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.26) 9%, rgba(0,0,0,0.84) 26%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.9) 63%, rgba(0,0,0,0.42) 81%, rgba(0,0,0,0) 97%)';

/**
 * Strips making up the column, widest first. `offset` is how far left of the
 * head the strip starts; the rest of its width sits to the right, so the haze
 * can carry a long tail behind the head and a short falloff in front of it.
 * That asymmetry is what gives the sweep a direction now that the light paints
 * in front of the artifacts — a symmetric column reads as a static divider.
 *
 * Alphas are deliberately low on the wide strips. These composite normally, not
 * additively, so over a white podium or a label a heavy cyan wash tints and
 * dulls rather than brightens. Additive blending would fix that properly, but
 * `will-change: transform` on the traveller makes it a stacking context, which
 * turns any blend mode into a group operation against transparent black instead
 * of against the page.
 */
const BEAM_LAYERS: readonly { width: number; offset: number; fill: string }[] = [
  { width: 210, offset: 148, fill: 'rgba(44,193,235,0.10)' },
  { width: 38, offset: 19, fill: 'rgba(96,214,255,0.30)' },
  { width: 11, offset: 5.5, fill: 'rgba(214,247,255,0.70)' },
];

/** Sizes the mask box. Overflow is fine — the mask tile is vertical-only. */
const BEAM_COLUMN_WIDTH = 220;

/** Fades the moving light in and out at the rail's ends. */
const BEAM_EDGE_FADE =
  'linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,1) 44px, rgba(0,0,0,1) calc(100% - 44px), rgba(0,0,0,0) 100%)';

const RAIL_TOP = 'calc(var(--scan-scene) * 0.886)';
function ScanRail({
  beamRef,
  dwelling,
  revealedCount,
}: {
  beamRef: React.RefObject<HTMLDivElement | null>;
  /** Beam is over an artifact. Drives the dwell. */
  dwelling: boolean;
  revealedCount: number;
}): React.ReactElement {
  return (
    // Two layers, split by what each thing physically is.
    //
    // Floor markings sit BEHIND the nodes so the podiums occlude them, the way
    // a line painted on a floor is hidden by anything standing on it. The
    // moving light sits IN FRONT, because a scanner beam passes over what it
    // scans. Getting this backwards is what made the beam look weak: the
    // podium is a wide opaque ellipse parked exactly on the beam's hottest
    // point, so the only part left visible was the faint stub below it.
    //
    // The split costs nothing in sync: the markings are static, so there is
    // still exactly one animation driving the whole section.
    //
    // Below lg both layers go transparent rather than `display: none`. A hidden
    // element runs no animation, and the traveller's animation is the clock the
    // whole section reads — removing it from the box tree would stall the
    // readout at every breakpoint that does not draw the beam.
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 lg:opacity-100"
      >
        {/* Unswept rail */}
        <div
          className="absolute inset-x-0"
          style={{
            top: RAIL_TOP,
            height: '1px',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.15) 14%, rgba(255,255,255,0.15) 86%, rgba(255,255,255,0.03) 100%)',
          }}
        />

        {/* Stage ticks. Each one latches on when the beam clears it and stays
            lit for the rest of the pass, so the rail keeps a record of how far
            the run has got — the way a measured track on an instrument does. */}
        {STAGES.map((stage, i) => {
          const crossed = i < revealedCount;
          return (
            <div
              key={stage.id}
              className="absolute"
              style={{
                left: `${((i + 0.5) / STAGE_COUNT) * 100}%`,
                top: `calc(${RAIL_TOP} - ${crossed ? 5 : 3}px)`,
                width: '1px',
                height: crossed ? '11px' : '7px',
                marginLeft: '-0.5px',
                background: crossed ? 'rgba(150,233,255,0.85)' : 'rgba(255,255,255,0.24)',
                transition: 'height 180ms ease-out, top 180ms ease-out, background 180ms ease-out',
              }}
            />
          );
        })}
      </div>

      {/* The horizontal mask replaces `overflow-hidden`'s hard cut at the
          container edges. Clipping a soft 210px haze against a straight edge
          leaves a crisp vertical seam that reads as a shadow every time the
          beam enters or leaves; fading it out over 44px lets the light arrive
          and depart instead. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-0 lg:opacity-100"
        style={{
          maskImage: BEAM_EDGE_FADE,
          WebkitMaskImage: BEAM_EDGE_FADE,
          // Light must not be able to darken anything. Composited normally, the
          // cyan haze brightens the dark background but drops the red channel
          // hard over the white podium and the light card faces, which is what
          // put a grey band behind the head. `screen` can only ever lighten, so
          // the band is gone by construction rather than by tuning alphas down
          // until it stops being visible.
          //
          // This is safe here specifically because the blend is on the OUTERMOST
          // element of the group. The traveller inside has an animated transform
          // and so is its own stacking context; blending there would composite
          // against transparent black and paint a black box. From here the
          // nearest ancestor stacking context is the root, so the backdrop is
          // the real page: section gradient, meshes and nodes included.
          mixBlendMode: 'screen',
        }}
      >
        {/* Traveller */}
        <div ref={beamRef} className="cs-scan-travel absolute inset-y-0 left-0 w-full">
          {/* Swept rail — a flat dim fill for everything already crossed. Running
            the bright gradient across the full swept width instead spreads the
            decay over 1300px, which reads as a wash rather than a wake. */}
          <div
            className="absolute inset-x-0"
            style={{
              top: RAIL_TOP,
              height: '1px',
              background: 'rgba(127,227,255,0.20)',
            }}
          />

          {/* Rail wake — the short hot segment just behind the head. Kept to a
              hairline: the wider pill that used to sit under it read as a
              horizontal disc parked at the scanner's centre, which fights the
              column for attention and makes the head look like a bead on a
              wire rather than a beam. */}
          <div
            className="absolute right-0"
            style={{
              top: RAIL_TOP,
              width: '210px',
              height: '1px',
              background:
                'linear-gradient(90deg, rgba(127,227,255,0) 0%, rgba(127,227,255,0.30) 62%, rgba(190,243,255,0.62) 100%)',
            }}
          />

          {/* Light column. One mask on the wrapper carries the vertical profile
            for every strip inside it. The wrapper needs a real width: a mask
            image is sized to the element's own box, so a zero-width wrapper
            resolves to an empty mask and erases everything it contains. */}
          {/* The dwell. Between stages the column runs narrow and quiet; over an
              artifact it opens up and brightens, then closes again. A scanner
              that looks alive because it is reacting to a target beats one that
              looks alive because it is shimmering on a timer — the first is
              behaviour, the second is decoration, and only the first tells the
              visitor anything. The gain is driven by the same litIndex that
              drives the lock-on, so beam and target always agree. */}
          <div
            className="absolute inset-y-0 right-0"
            style={{
              width: `${BEAM_COLUMN_WIDTH}px`,
              marginRight: `${-BEAM_COLUMN_WIDTH / 2}px`,
              maskImage: BEAM_PROFILE,
              WebkitMaskImage: BEAM_PROFILE,
              opacity: dwelling ? 1 : 0.72,
              transform: `scaleX(${dwelling ? 1.22 : 0.78})`,
              transition: 'opacity 300ms ease-out, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {BEAM_LAYERS.map((layer) => (
              <div
                key={layer.width}
                className="absolute inset-y-0 left-1/2"
                style={{
                  width: `${layer.width}px`,
                  marginLeft: `${-layer.offset}px`,
                  background: `linear-gradient(90deg, rgba(44,193,235,0) 0%, ${layer.fill} ${((layer.offset / layer.width) * 100).toFixed(1)}%, rgba(44,193,235,0) 100%)`,
                }}
              />
            ))}

            {/* Hairline core */}
            <div
              className="absolute inset-y-0 left-1/2"
              style={{
                width: '1.5px',
                marginLeft: '-0.75px',
                background:
                  'linear-gradient(180deg, rgba(226,250,255,0.7) 0%, #FFFFFF 40%, #FFFFFF 70%, rgba(226,250,255,0.7) 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                           MAIN SECTION COMPONENT                           */
/* -------------------------------------------------------------------------- */

export function FinanceRiskChain(): React.ReactElement {
  const reduceMotion = useReducedMotion();
  const animated = !reduceMotion;
  const { beamRef, scan } = useScanClock(animated);

  const findings = findingsForPass(scan.pass);

  return (
    <section
      data-section="FinanceRiskChain"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      {/* Shared gradients */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <linearGradient id="podium-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="podium-base-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        @keyframes csCubeFloat1 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes csCubeFloat2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4.5px); } }
        @keyframes csCubeFloat3 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes csCursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes csShieldRingFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -24; } }
        @keyframes csScanTravel { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes csCardSweep { from { transform: translateX(-120%); } to { transform: translateX(320%); } }

        .cs-cube-float-1 { animation: csCubeFloat1 2.6s ease-in-out infinite; }
        .cs-cube-float-2 { animation: csCubeFloat2 3.1s ease-in-out infinite; }
        .cs-cube-float-3 { animation: csCubeFloat3 2.3s ease-in-out infinite; }
        .cs-cursor-blink { animation: csCursorBlink 0.9s step-end infinite; }
        .cs-shield-ring { animation: csShieldRingFlow 5s linear infinite; }

        .cs-scan-travel {
          animation: csScanTravel ${CYCLE_MS}ms linear infinite;
          will-change: transform;
        }

        .cs-card-sweep {
          animation: csCardSweep 1.1s ease-in-out;
          background: linear-gradient(90deg, rgba(127,227,255,0) 0%, rgba(127,227,255,0.28) 50%, rgba(127,227,255,0) 100%);
          -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%);
          mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-cube-float-1,
          .cs-cube-float-2,
          .cs-cube-float-3,
          .cs-cursor-blink,
          .cs-shield-ring,
          .cs-scan-travel,
          .cs-card-sweep {
            animation: none !important;
          }
        }
      `}</style>

      {/* Shared overlay meshes */}
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
        {/* Section header */}
        <div className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: '#ffffff',
              }}
            >
              Risk Enters Long{' '}
              <span
                style={{
                  background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Before Production
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
                maxWidth: '600px',
                margin: 0,
              }}
            >
              Every component that makes up your application can also introduce risk.
            </p>
          </Reveal>
        </div>

        {/* Scan rail. The scene size is a variable because the rail reads it to
            park itself on the podium base line. */}
        <div
          className="relative"
          style={
            {
              marginTop: 'clamp(36px, 4.5vw, 72px)',
              '--scan-scene': 'clamp(112px, 10.4vw, 152px)',
            } as React.CSSProperties
          }
        >
          <ScanRail
            beamRef={beamRef}
            dwelling={animated && scan.litIndex >= 0}
            revealedCount={animated ? scan.revealedCount : STAGE_COUNT}
          />

          <RevealStagger className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-0 lg:gap-y-0">
            {STAGES.map((stage, i) => (
              <RevealItem key={stage.id} className="min-w-0">
                <StageNode
                  stage={stage}
                  stageIndex={i}
                  pass={scan.pass}
                  lit={animated ? scan.litIndex === i : false}
                  revealed={animated ? i < scan.revealedCount : true}
                  findings={findings[i] ?? { critical: 0, high: 0 }}
                  animated={animated}
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
