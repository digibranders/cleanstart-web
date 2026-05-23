import type React from 'react';

/*
 * Figma node 798:2209 — "Why Does It Matter" section (1920 px artboard)
 *
 * Background: white
 * Decorative: two Union grid-pattern SVG blobs at top-left and top-right corners,
 *             clipped by section overflow-hidden. Two ellipse glows at top corners.
 * H2:  62px Manrope Bold, #111, tracking -3.1px (≈ -0.05em), lh 1, top 120px
 * 2×2 grid of problem cards with 1px gradient dividers (vertical + horizontal)
 * Each card: [purple glow + 3D illustration (296×220px)] [title 32px + desc 22px]
 * All interior dimensions scaled ×0.75 for the 1440px primary viewport.
 */

interface CardDef {
  img: string;
  /** Figma absolute-percentage positioning for the img inside its overflow container */
  imgStyle: React.CSSProperties;
  title: string;
  desc: string;
}

const CARDS: [CardDef, CardDef, CardDef, CardDef] = [
  {
    img: '/images/for-developers/why/card-bloated.png',
    imgStyle: { left: '8.15%', top: '-2.03%', width: '86.53%', height: '104.52%' },
    title: 'Bloated Base Images',
    desc: 'Public images include unnecessary packages and dependencies.',
  },
  {
    img: '/images/for-developers/why/card-vulnerabilities.png',
    imgStyle: { left: '9.12%', top: '-0.71%', width: '83.45%', height: '100.71%' },
    title: 'Inherited Vulnerabilities',
    desc: 'Most CVEs originate from upstream components.',
  },
  {
    img: '/images/for-developers/why/card-remediation.png',
    imgStyle: { left: '8.45%', top: '-8.18%', width: '87.16%', height: '117.27%' },
    title: 'Remediation Overload',
    desc: 'Teams spend time triaging inherited issues.',
  },
  {
    img: '/images/for-developers/why/card-development.png',
    imgStyle: { left: '15.93%', top: '1.36%', width: '72.54%', height: '96.83%' },
    title: 'Slower Development Cycles',
    desc: 'Security bottlenecks delay releases and deployments.',
  },
];

const DIVIDER_H =
  'linear-gradient(to right, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';
const DIVIDER_V =
  'linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';

function WhyCard({ img, imgStyle, title, desc }: CardDef): React.ReactElement {
  return (
    <div className="flex items-center" style={{ gap: 'clamp(16px, 1.67vw, 24px)' }}>
      {/* ── Illustration area ── */}
      <div
        className="relative shrink-0"
        style={{
          /* 296×220 in Figma → 222×165 at 1440px (×0.75); clamps down gracefully */
          width: 'clamp(160px, 15.4vw, 222px)',
          height: 'clamp(120px, 11.46vw, 165px)',
        }}
      >
        {/* Purple glow — Figma Ellipse 46681, 165 px, positioned at left=32px top=12px */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{ left: '24px', top: '9px', width: '56%', height: '75%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/for-developers/why/deco-glow-card.svg"
            alt=""
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>
        {/* 3D illustration — clipped to container, exact Figma proportional offsets */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt=""
            className="absolute max-w-none"
            style={imgStyle}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Text ── */}
      <div className="flex flex-col min-w-0" style={{ flex: '1 1 0', gap: '17px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            /* 32px in Figma → 24px at 1440px; clamp from 20px mobile → 24px desktop */
            fontSize: 'clamp(1.125rem, 1.67vw, 2rem)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            color: '#111111',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            /* 22px in Figma → 16.5px at 1440px */
            fontSize: 'clamp(0.875rem, 1.15vw, 1.375rem)',
            fontWeight: 400,
            letterSpacing: '-0.05em',
            lineHeight: 1.4,
            color: '#333333',
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export function DeveloperWhyItMatters(): React.ReactElement {
  return (
    <section
      data-section="DeveloperWhyItMatters"
      className="relative overflow-hidden bg-white"
    >
      {/* ── Left Union grid-pattern blob (Figma: left=-500, top=-539, w=1181) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
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

      {/* ── Right Union grid-pattern blob (Figma: left=1216, top=-535, w=1101) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
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

      {/* ── Top-left ellipse glow (Figma: left=-68, top=-76, 258px + inset-[-94.19%]) ── */}
      {/* Rendered size at 1920: 258 × (1 + 2×0.9419) ≈ 744px; center at (61, 53) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          /* left = center_x - half_rendered = 61 - 372 = -311 */
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

      {/* ── Top-right ellipse glow (Figma: left=1720, top=-76, 258px + inset-[-94.19%]) ── */}
      {/* center at (1849, 53); rendered 744px */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
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

      {/* ── Content ── */}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: '48px',
          paddingRight: '48px',
          paddingTop: 'clamp(72px, 6.25vw, 120px)',
          paddingBottom: 'clamp(60px, 5.2vw, 100px)',
        }}
      >
        {/* H2 — Figma: 62px Manrope Bold, tracking -3.1px */}
        <h2
          className="text-center mx-auto"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.23vw, 3.875rem)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#111111',
            marginBottom: 'clamp(48px, 4.17vw, 80px)',
          }}
        >
          Why Does It Matter
        </h2>

        {/* ── 2×2 problem-card grid ── */}
        <div className="relative">
          {/* Vertical centre divider — Figma: 1px line at x=962 (page centre) */}
          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              left: '50%',
              top: '4%',
              bottom: '4%',
              width: '1px',
              background: DIVIDER_V,
            }}
          />

          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ rowGap: 0, columnGap: 0 }}
          >
            {/* ── Row 1 ── */}
            <div style={{ paddingRight: '32px', paddingBottom: '48px' }}>
              <WhyCard {...CARDS[0]} />
            </div>
            <div style={{ paddingLeft: '32px', paddingBottom: '48px' }}>
              <WhyCard {...CARDS[1]} />
            </div>

            {/* Horizontal divider spanning both columns — Figma: 1234px × 1px at y=530 */}
            <div
              aria-hidden
              className="pointer-events-none hidden lg:block"
              style={{
                gridColumn: '1 / -1',
                height: '1px',
                background: DIVIDER_H,
              }}
            />

            {/* ── Row 2 ── */}
            <div style={{ paddingRight: '32px', paddingTop: '48px' }}>
              <WhyCard {...CARDS[2]} />
            </div>
            <div style={{ paddingLeft: '32px', paddingTop: '48px' }}>
              <WhyCard {...CARDS[3]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
