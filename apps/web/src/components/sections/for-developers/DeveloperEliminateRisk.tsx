import Image from 'next/image';
import type React from 'react';
import { MetricCounter } from './MetricCounter';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/Reveal';

const ICON_BASE = '/images/for-developers/eliminate-risk';

/*
 * "Eliminate Risk Earlier" — Glow-Anchor card variant.
 *
 * The inner surface is a single dark gradient with no internal ellipse glows;
 * that glow vocabulary is reserved for the marquee and CTA cards so each
 * section keeps a distinct card identity.
 */

interface MetricCardData {
  kind: 'number' | 'headline';
  /** When kind === 'number': integer target for the count-up. */
  numberTo?: number;
  /** When kind === 'number': suffix after the number. */
  numberSuffix?: string;
  /** When kind === 'headline': the 1–2 word emphasized phrase. */
  headline?: string;
  /** Subtitle / label sentence shown directly below the title. */
  label: string;
  /** 3D icon PNG. */
  iconSrc: string;
}

const METRICS: MetricCardData[] = [
  {
    kind: 'number',
    numberTo: 89,
    numberSuffix: '%',
    label: 'Fewer inherited vulnerabilities',
    iconSrc: `${ICON_BASE}/icon-shield.webp`,
  },
  {
    kind: 'headline',
    headline: 'Smaller Images',
    label: 'Reduced runtime footprint',
    iconSrc: `${ICON_BASE}/icon-cube.webp`,
  },
  {
    kind: 'headline',
    headline: 'Faster Pull Times',
    label: 'Improve deployment speed and scaling',
    iconSrc: `${ICON_BASE}/icon-clock.webp`,
  },
  {
    kind: 'headline',
    headline: 'Lower Risk',
    label: 'Focus on actionable risk',
    iconSrc: `${ICON_BASE}/icon-chart.webp`,
  },
];

function GlowAnchorCard({
  kind,
  numberTo,
  numberSuffix,
  headline,
  label,
  iconSrc,
}: MetricCardData): React.ReactElement {
  return (
    <div
      className="group relative h-full overflow-hidden transition-[box-shadow,border-color] duration-300 ease-out hover:border-white/15"
      style={{
        borderRadius: '18px',
        // Solid (no alpha) background so the icon's mix-blend-mode: lighten
        // composes against a known dark color even when the card forms its
        // own stacking context. A transparent card bg + hover transform would
        // trap the blend mode inside the card and expose the black plate
        // baked into the icon PNGs.
        background:
          'linear-gradient(165deg, #1F1857 0%, #161241 60%, #1C1650 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 40px rgba(7,5,30,0.45)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 0,
          left: 0,
          width: '52px',
          height: '52px',
          borderTopLeftRadius: '18px',
          background:
            'linear-gradient(135deg, rgba(154,81,255,0.55) 0%, rgba(154,81,255,0) 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 0,
          left: 0,
          width: '52px',
          height: '2px',
          borderTopLeftRadius: '18px',
          background:
            'linear-gradient(90deg, #9A51FF 0%, rgba(154,81,255,0) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 0,
          left: 0,
          width: '2px',
          height: '52px',
          borderTopLeftRadius: '18px',
          background:
            'linear-gradient(180deg, #9A51FF 0%, rgba(154,81,255,0) 100%)',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: '14px',
          right: '14px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2CC1EB 0%, #9A51FF 100%)',
          boxShadow: '0 0 14px 2px rgba(44,193,235,0.55)',
        }}
      />

      <div
        className="relative flex h-full flex-col"
        style={{ padding: '32px 26px 30px' }}
      >
        <div className="mb-6 flex items-start">
          <div
            className="relative inline-flex items-center justify-center"
            style={{ width: '116px', height: '116px' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: '50%',
                background:
                  'radial-gradient(50% 50% at 50% 50%, rgba(99,179,255,0.30) 0%, rgba(99,179,255,0) 75%)',
              }}
            />
            <Image
              src={iconSrc}
              alt=""
              width={108}
              height={108}
              className="relative z-10 select-none"
              style={{
                width: '108px',
                height: '108px',
                objectFit: 'contain',
                mixBlendMode: 'lighten',
              }}
            />
          </div>
        </div>

        {kind === 'number' && numberTo !== undefined ? (
          <div
            className="text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: '14px',
            }}
          >
            <MetricCounter to={numberTo} suffix={numberSuffix ?? ''} />
          </div>
        ) : (
          <h3
            className="text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: '14px',
            }}
          >
            {headline}
          </h3>
        )}

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.72)',
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '14%',
          right: '14%',
          bottom: 0,
          height: '1.5px',
          background:
            'linear-gradient(90deg, rgba(154,81,255,0) 0%, #9A51FF 30%, #2CC1EB 70%, rgba(44,193,235,0) 100%)',
          opacity: 0.85,
        }}
      />
    </div>
  );
}

export function DeveloperEliminateRisk(): React.ReactElement {
  return (
    <section
      data-section="DeveloperEliminateRisk"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
        paddingTop: '120px',
        paddingBottom: 'var(--spacing-section-cta)',
      }}
    >
      <div className="relative mx-auto w-full max-w-[1276px] px-6 sm:px-10">
        <Reveal header>
          <h2
            className="mx-auto text-center text-white"
            style={{
              maxWidth: '720px',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 700,
              letterSpacing: '-0.05em',
              lineHeight: 1.1,
              marginBottom: '64px',
            }}
          >
            Eliminate Risk <span className="cs-text-gradient-impact">Earlier</span>
          </h2>
        </Reveal>

        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: '24px' }}
        >
          {METRICS.map((m) => (
            <RevealItem key={m.label}>
              <GlowAnchorCard {...m} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
