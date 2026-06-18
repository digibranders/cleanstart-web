import type React from 'react';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/Reveal';

interface ArtifactCard {
  glyph: string;
  title: string;
  desc: string;
}

const CARDS: ArtifactCard[] = [
  {
    glyph: '/images/for-developers/trusted-artifacts/glyph-images.svg',
    title: 'Clean Images',
    desc: 'Minimal, verified, zero-CVE container foundations.',
  },
  {
    glyph: '/images/for-developers/trusted-artifacts/glyph-libraries.svg',
    title: 'Clean Libraries',
    desc: 'Trusted open-source dependencies built from verified upstream sources.',
  },
  {
    glyph: '/images/for-developers/trusted-artifacts/glyph-models.svg',
    title: 'Clean Models',
    desc: 'Verified ML and AI software artifacts for modern AI applications.',
  },
];

/** Purple→cyan accent applied to the trailing word of the heading. */
const HEADING_ACCENT =
  'linear-gradient(105.28deg, #9A51FF 1.76%, #2CC1EB 98.78%)';
/** Gradient hairline separating this block from “Why It Matters” above. */
const SEPARATOR =
  'linear-gradient(90deg, rgba(170,165,165,0) 0%, #AAA5A5 49.78%, rgba(170,165,165,0) 100%)';
/** Translucent cyan frame around each card (Figma: cyan @ 40%). */
const CARD_FRAME = 'rgba(44, 193, 235, 0.4)';
/** Soft blue glow anchored to the card's top-left, behind the icon. */
const CARD_GLOW_TL =
  'radial-gradient(circle at 0% 0%, rgba(35, 156, 255, 0.18) 0%, rgba(35, 156, 255, 0) 60%)';
/** Soft magenta glow anchored to the card's bottom-right. */
const CARD_GLOW_BR =
  'radial-gradient(circle at 100% 100%, rgba(208, 150, 255, 0.22) 0%, rgba(208, 150, 255, 0) 62%)';
/** Glossy blue sphere (Figma blue-600 → blue-700) with its drop shadow + rim. */
const BALL_GRADIENT = 'linear-gradient(to bottom, #239cff 0%, #005be3 100%)';
const BALL_SHADOW =
  '0 8px 20px rgba(28,60,142,0.33), inset 0 -0.5px 0.6px rgba(0,44,179,0.5), inset 0 0.4px 1.2px rgba(255,255,255,0.81)';
/** Top sheen on the sphere. */
const BALL_SHEEN =
  'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)';

function ArtifactBall({ glyph }: { glyph: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative flex shrink-0 items-center justify-center"
      style={{
        width: 'clamp(76px, 6.46vw, 93px)',
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        background: BALL_GRADIENT,
        boxShadow: BALL_SHADOW,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: 'inherit', background: BALL_SHEEN }}
      />
      <div className="relative" style={{ width: '69%', height: '69%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={glyph}
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function ArtifactCardView({ glyph, title, desc }: ArtifactCard): React.ReactElement {
  return (
    <div
      className="relative h-full"
      style={{ background: CARD_FRAME, borderRadius: '22px', padding: '3px' }}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden bg-white"
        style={{
          borderRadius: '19px',
          padding: 'clamp(20px, 1.67vw, 24px)',
          minHeight: 'clamp(252px, 20.5vw, 296px)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: CARD_GLOW_TL }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: CARD_GLOW_BR }}
        />

        <div className="relative">
          <ArtifactBall glyph={glyph} />
        </div>

        <div className="relative mt-auto flex flex-col" style={{ gap: '12px', paddingTop: '24px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#333333',
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
              maxWidth: '300px',
            }}
          >
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DeveloperTrustedArtifacts(): React.ReactElement {
  return (
    <section
      data-section="DeveloperTrustedArtifacts"
      className="relative overflow-hidden"
      style={{ backgroundColor: '#F6F6F6' }}
    >
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingBottom: 'clamp(48px, 5.2vw, 100px)',
        }}
      >
        <div aria-hidden style={{ height: '1px', width: '100%', background: SEPARATOR }} />

        <div style={{ marginTop: 'clamp(56px, 6.25vw, 90px)' }}>
          <Reveal header>
            <h2
              className="mx-auto text-center"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
                maxWidth: '700px',
                marginBottom: 'clamp(16px, 1.5vw, 24px)',
                textWrap: 'balance',
              }}
            >
              Trusted Software Artifacts for Modern{' '}
              <span
                style={{
                  backgroundImage: HEADING_ACCENT,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Development
              </span>
            </h2>
          </Reveal>

          <Reveal header>
            <p
              className="mx-auto text-center"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.45,
                color: '#555555',
                maxWidth: '640px',
                marginBottom: 'clamp(40px, 4.17vw, 80px)',
                textWrap: 'balance',
              }}
            >
              Verified software foundations for containers, dependencies, and AI applications.
            </p>
          </Reveal>

          <RevealStagger className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            {CARDS.map((card) => (
              <RevealItem key={card.title}>
                <ArtifactCardView {...card} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
