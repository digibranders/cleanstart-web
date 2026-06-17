import type React from 'react';
import { Boxes, Cpu, Scale } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/*
 * CisoRisks — "Why Traditional Security Is Falling Behind"
 *
 * Three problem-framing cards (AI velocity, inherited/open-source risk,
 * compliance pressure) on the #F6F6F6 wash shared with the rest of the
 * for-CISO page. Each card leads with a gradient icon token + problem title +
 * statement (the hero), and closes with a supporting "proof" block carrying
 * the headline stat. CSS-only hover lift — no JS animation. Decorations
 * (hex-grid blobs + corner ellipse glows) reuse the for-developers "why"
 * assets so the page reads as one continuous surface.
 */

type IconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
}>;

interface RiskStat {
  stat: string;
  statDesc: string;
  title: string;
  desc: string;
  Icon: IconComponent;
}

const STATS: readonly [RiskStat, RiskStat, RiskStat] = [
  {
    stat: '80%',
    statDesc: 'of enterprise software development will be AI-assisted by 2027',
    title: 'AI Accelerates Software Risk',
    desc: 'Dependencies now grow faster than security teams can validate trust.',
    Icon: Cpu,
  },
  {
    stat: '70%+',
    statDesc: 'of modern applications originate from open-source components',
    title: 'The Inherited Risk Problem',
    desc: 'Modern applications inherit vulnerabilities and unknown dependencies.',
    Icon: Boxes,
  },
  {
    stat: '$4.5M',
    statDesc: 'average cost of a software supply chain breach',
    title: 'Rising Compliance Pressure',
    desc: 'Modern regulations increasingly require software supply chain visibility.',
    Icon: Scale,
  },
];

// Exact Figma stat-figure gradient — horizontal purple → cyan sweep.
const STAT_GRADIENT: React.CSSProperties = {
  background:
    'linear-gradient(94deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

function StatCard({ stat, statDesc, title, desc, Icon }: RiskStat): React.ReactElement {
  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden shadow-[0_12px_32px_-16px_rgba(45,90,200,0.12)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(45,90,200,0.24)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{
        borderRadius: '24px',
        // Gradient hairline border via padding-box/border-box layering — pure CSS.
        border: '1.5px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, rgba(154, 81, 255, 0.5) 0%, rgba(44, 193, 235, 0.5) 100%) border-box',
        padding: 'clamp(24px, 2.2vw, 32px)',
      }}
    >
      {/* Soft bottom-right glow inside the card — strengthens on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          right: '-60px',
          bottom: '-60px',
          width: '262px',
          height: '262px',
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(223, 155, 255, 0.28) 0%, rgba(223, 155, 255, 0) 70%)',
        }}
      />

      {/* Gradient icon token — the card's visual anchor. */}
      <div
        aria-hidden
        className="relative flex shrink-0 items-center justify-center transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(150deg, rgb(154, 81, 255) 0%, rgb(44, 193, 235) 100%)',
          boxShadow:
            '0 12px 28px -8px rgba(124, 92, 247, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 -2px 6px rgba(20, 20, 60, 0.18)',
        }}
      >
        <Icon size={34} strokeWidth={2} className="text-white" aria-hidden />
      </div>

      {/* Problem title + statement — the hero. flex-1 floats the proof block to the base. */}
      <div
        className="relative flex flex-1 flex-col"
        style={{ gap: '12px', marginTop: 'clamp(20px, 2vw, 28px)' }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            color: '#1a1a1a',
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
            lineHeight: 1.45,
            color: '#444444',
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>

      {/* Supporting proof block — headline stat above a full-width caption.
          Stacking gives every caption the same width so all three wrap to the
          same number of lines, keeping the cards aligned. */}
      <div
        className="relative flex flex-col"
        style={{
          marginTop: 'clamp(20px, 2vw, 28px)',
          gap: '6px',
          padding: 'clamp(12px, 1.1vw, 16px) clamp(14px, 1.2vw, 18px)',
          borderRadius: '14px',
          background:
            'linear-gradient(94deg, rgba(154, 81, 255, 0.07) 1.758%, rgba(44, 193, 235, 0.07) 98.781%)',
          border: '1px solid rgba(44, 193, 235, 0.28)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            ...STAT_GRADIENT,
          }}
        >
          {stat}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
            color: '#555555',
          }}
        >
          {statDesc}
        </span>
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
            Why Traditional Security Is{' '}
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
              Falling Behind
            </span>
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
