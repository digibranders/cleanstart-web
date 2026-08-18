import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { RISK_ART } from './FinanceRiskArt';

/*
 * FinanceRiskChain — "Risk Enters Long Before Production".
 *
 * The one dark band in the page body, and the page's turn from what the
 * software is made of to where it goes wrong. Built to the proposal's own
 * reference for this section: a chain of objects with risk arriving at every
 * one of them, resolving at the institution.
 *
 * It is deliberately a SEQUENCE where the section above it is a SET — six
 * objects wired in order on a spine, on dark, at smaller scale, ending in the
 * one object on the page that is not a software component. Same drawn
 * vocabulary, different argument, so the two sections never read as the same
 * layout twice.
 *
 * Real DOM with real text, so it reflows, translates, and reads to a screen
 * reader — none of which the reference raster could do.
 */

interface Stage {
  title: string;
  /** The terminal node — what everything upstream arrives at. */
  terminal?: boolean;
}

const STAGES: readonly Stage[] = [
  { title: 'Open Source Components' },
  { title: 'Libraries & Dependencies' },
  { title: 'Container Images' },
  { title: 'AI-Generated Code' },
  { title: 'Build & Delivery Pipeline' },
  { title: 'Financial Applications', terminal: true },
];

// Spine colour per segment — risk red where it enters, resolving toward the
// cyan of the terminal object. One entry per gap between stages.
const SEGMENT: readonly string[] = [
  'rgba(255, 95, 95, 0.6)',
  'rgba(226, 96, 158, 0.6)',
  'rgba(184, 96, 200, 0.6)',
  'rgba(140, 130, 224, 0.62)',
  'rgba(95, 216, 255, 0.68)',
];

function StageNode({
  title,
  terminal,
  index,
  last,
}: Stage & { index: number; last: boolean }): React.ReactElement {
  const Art = RISK_ART[index];
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Spine segment to the next stage — drawn per node so the chain stops at
          the institution rather than running on past it. */}
      {!last ? (
        <div
          aria-hidden
          className="pointer-events-none absolute hidden lg:block"
          style={{
            left: '50%',
            right: 'calc(-50% - var(--fin-gap))',
            top: '71%',
            height: '1px',
            background: SEGMENT[index],
          }}
        >
          {/* Risk entering here and moving downstream. Each segment carries one,
              staggered, so the chain reads as continuous accumulation rather
              than as six separate events. */}
          <span
            className="cs-fin-carry"
            style={{ background: SEGMENT[index], animationDelay: `${index * 0.55}s` }}
          />
        </div>
      ) : null}

      <div
        aria-hidden
        className="relative z-[1]"
        style={{ width: 'min(100%, 196px)', aspectRatio: '160 / 150' }}
      >
        {Art ? <Art /> : null}
      </div>

      <h3
        style={{
          marginTop: '2px',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h6)',
          fontWeight: 600,
          letterSpacing: '-0.015em',
          lineHeight: 1.35,
          color: terminal ? '#a6ecff' : '#ffffff',
          maxWidth: '16ch',
        }}
      >
        {title}
      </h3>
    </div>
  );
}

export function FinanceRiskChain(): React.ReactElement {
  return (
    <section
      data-section="FinanceRiskChain"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0e0a20 0%, #150e33 52%, #110c28 100%)',
      }}
    >
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(44px, 4.2vw, 68px)',
          paddingBottom: 'clamp(36px, 3.4vw, 52px)',
        }}
      >
        <div className="grid grid-cols-1 gap-x-16 gap-y-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <Reveal header>
            <h2
              className="text-white"
              style={{
                maxWidth: '19ch',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Risk Enters Long Before Production
            </h2>
          </Reveal>

          <Reveal delay={0.08} y={20}>
            <p
              style={{
                maxWidth: '46ch',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.55,
                color: 'rgba(222, 218, 244, 0.76)',
                margin: 0,
              }}
            >
              Vulnerabilities and unknowns are introduced at every step of the software supply
              chain.
            </p>
          </Reveal>
        </div>

        <Reveal y={22}>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            style={
              {
                marginTop: 'clamp(34px, 3.6vw, 56px)',
                // Read back by each node's spine segment so the connector spans
                // exactly the gutter it has to cross.
                '--fin-gap': 'clamp(12px, 1.4vw, 24px)',
                columnGap: 'var(--fin-gap)',
                rowGap: 'clamp(28px, 3vw, 40px)',
              } as React.CSSProperties
            }
          >
            {STAGES.map((s, i) => (
              <StageNode key={s.title} {...s} index={i} last={i === STAGES.length - 1} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12} y={16}>
          <p
            style={{
              marginTop: 'clamp(32px, 3.4vw, 52px)',
              paddingTop: 'clamp(18px, 1.8vw, 26px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.13)',
              maxWidth: '34ch',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h4)',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              lineHeight: 1.35,
              color: '#ffd8d8',
            }}
          >
            By the time it reaches production, the risk is already inside.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
