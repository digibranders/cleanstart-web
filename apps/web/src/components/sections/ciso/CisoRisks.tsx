import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

/*
 * CisoRisks — "AI Scales Code Velocity. Security Can't Keep Up."
 *
 * Three stat cards (adoption, inherited risk, compliance cost) on the #F6F6F6
 * wash shared with the rest of the for-CISO page. Each card pairs a gradient
 * headline figure with a short framing statement, split by a hairline divider.
 * Decorations (hex-grid blobs + corner ellipse glows) reuse the for-developers
 * "why" assets so the page reads as one continuous surface.
 */

interface RiskStat {
  stat: string;
  statDesc: string;
  title: string;
  desc: string;
}

const STATS: readonly [RiskStat, RiskStat, RiskStat] = [
  {
    stat: '80%',
    statDesc: 'of enterprise software development will be AI-assisted by 2027',
    title: 'AI Accelerates Software Risk',
    desc: 'AI-generated code accelerates dependency growth faster than security teams can validate trust.',
  },
  {
    stat: '70%+',
    statDesc: 'of modern application originates from open-source components',
    title: 'The Inherited Risk Problem',
    desc: 'Modern applications inherit vulnerabilities and unknown dependencies before deployment.',
  },
  {
    stat: '$4.5M',
    statDesc: 'average breach cost from software supply chain compromise',
    title: 'Compliance Expectations Are Rising',
    desc: 'Modern regulations increasingly require software supply chain visibility and verifiable compliance evidence.',
  },
];

// Card-internal hairline divider — fades to transparent at both ends.
const CARD_DIVIDER =
  'linear-gradient(90deg, rgba(217,217,217,0) 0%, #d9d9d9 47%, rgba(217,217,217,0) 100%)';

// Exact Figma stat-figure gradient — horizontal purple → cyan sweep.
const STAT_GRADIENT: React.CSSProperties = {
  background:
    'linear-gradient(94deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

function StatCard({ stat, statDesc, title, desc }: RiskStat): React.ReactElement {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-white"
      style={{
        borderRadius: '24px',
        border: '1.5px solid rgba(44, 193, 235, 0.4)',
        padding: 'clamp(24px, 2.2vw, 32px)',
        boxShadow: '0 12px 32px -16px rgba(45, 90, 200, 0.12)',
      }}
    >
      {/* Soft bottom-right glow inside the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: '-60px',
          bottom: '-60px',
          width: '262px',
          height: '262px',
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(223, 155, 255, 0.28) 0%, rgba(223, 155, 255, 0) 70%)',
        }}
      />

      <div className="relative flex flex-col" style={{ gap: '12px', minHeight: 'clamp(84px, 7vw, 104px)' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h1)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            margin: 0,
            ...STAT_GRADIENT,
          }}
        >
          {stat}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: '#333333',
            margin: 0,
          }}
        >
          {statDesc}
        </p>
      </div>

      <div
        aria-hidden
        style={{ height: '1px', background: CARD_DIVIDER, margin: 'clamp(20px, 2vw, 28px) 0' }}
      />

      <div className="relative flex flex-1 flex-col" style={{ gap: '12px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#333333',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: '#333333',
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export function CisoRisks(): React.ReactElement {
  return (
    <section
      data-section="CisoRisks"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(246,246,246,0) 0%, #F6F6F6 96px, #F6F6F6 calc(100% - 96px), rgba(246,246,246,0) 100%)',
      }}
    >
      {/* Left hex-grid blob — bleeds off-canvas intentionally. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(-500 / 1920 * 100vw)',
          top: 'calc(-539 / 1920 * 100vw)',
          width: 'calc(1181 / 1920 * 100vw)',
          height: 'calc(1181 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-union-left.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Right hex-grid blob — bleeds off the right edge intentionally. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(1216 / 1920 * 100vw)',
          top: 'calc(-535 / 1920 * 100vw)',
          width: 'calc(1101 / 1920 * 100vw)',
          height: 'calc(1101 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-union-right.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Top-left + top-right ellipse glows. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(-311 / 1920 * 100vw)',
          top: 'calc(-319 / 1920 * 100vw)',
          width: 'calc(744 / 1920 * 100vw)',
          height: 'calc(744 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-glow-top-left.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(1477 / 1920 * 100vw)',
          top: 'calc(-319 / 1920 * 100vw)',
          width: 'calc(744 / 1920 * 100vw)',
          height: 'calc(744 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-glow-top-right.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(56px, 6.25vw, 120px)',
          paddingBottom: 'clamp(48px, 5.2vw, 100px)',
        }}
      >
        <Reveal header>
          <h2
            className="text-center mx-auto"
            style={{
              maxWidth: '760px',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              color: '#111111',
              margin: '0 auto',
            }}
          >
            AI Scales Code Velocity. Security Can&rsquo;t{' '}
            <span
              style={{
                background:
                  'linear-gradient(105deg, rgb(154, 81, 255) 40%, rgb(44, 193, 235) 98.781%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              Keep Up
            </span>
            .
          </h2>
        </Reveal>

        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ marginTop: 'clamp(32px, 4.17vw, 80px)', gap: 'clamp(16px, 1.67vw, 32px)' }}
        >
          {STATS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} y={24}>
              <StatCard {...s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
