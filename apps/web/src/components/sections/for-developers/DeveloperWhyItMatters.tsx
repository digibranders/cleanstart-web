import type React from 'react';

/*
 * Figma node 798:2209 (desktop) + 857:6066 (mobile).
 *
 * Desktop: 2×2 grid of problem cards with 1px gradient dividers — illustration on the
 *   left, text on the right, no per-card background.
 * Mobile (below lg / 1024px): single-column stack. Each card is a self-contained white
 *   tile with 24px radius and soft shadow, icon centered at top with a purple glow
 *   halo, title + description centered below.
 *
 * Mobile order in Figma: Bloated → Remediation → Inherited Vulnerabilities → Slower.
 * Desktop order in Figma: Bloated → Inherited Vulnerabilities → Remediation → Slower.
 * Each card carries its own desktop / mobile slot to honour both orderings without
 * re-shuffling the data array.
 */

interface CardDef {
  /** Desktop side-by-side illustration (large 3D render). */
  desktopImg: string;
  /** Figma absolute-percentage positioning for the desktop img inside its overflow container */
  desktopImgStyle: React.CSSProperties;
  /** Mobile centered icon (smaller, standalone). */
  mobileIcon: string;
  /** Mobile icon sizing inside the 108×87 frame — Figma positions per card. */
  mobileIconStyle: React.CSSProperties;
  title: string;
  desc: string;
}

const CARDS: [CardDef, CardDef, CardDef, CardDef] = [
  {
    desktopImg: '/images/for-developers/why/card-bloated.png',
    desktopImgStyle: { left: '8.15%', top: '-2.03%', width: '86.53%', height: '104.52%' },
    mobileIcon: '/images/for-developers/why/icon-bloated.png',
    mobileIconStyle: { left: '12px', top: '2px', width: '84px', height: '84px' },
    title: 'Bloated Base Images',
    desc: 'Public images include unnecessary packages and dependencies.',
  },
  {
    desktopImg: '/images/for-developers/why/card-vulnerabilities.png',
    desktopImgStyle: { left: '9.12%', top: '-0.71%', width: '83.45%', height: '100.71%' },
    mobileIcon: '/images/for-developers/why/icon-vulnerabilities.png',
    mobileIconStyle: { left: '-3px', top: '8px', width: '115px', height: '71px' },
    title: 'Inherited Vulnerabilities',
    desc: 'Most CVEs originate from upstream components.',
  },
  {
    desktopImg: '/images/for-developers/why/card-remediation.png',
    desktopImgStyle: { left: '8.45%', top: '-8.18%', width: '87.16%', height: '117.27%' },
    mobileIcon: '/images/for-developers/why/icon-remediation.png',
    mobileIconStyle: { left: '8px', top: '-3px', width: '93px', height: '93px' },
    title: 'Remediation Overload',
    desc: 'Teams spend time triaging inherited issues.',
  },
  {
    desktopImg: '/images/for-developers/why/card-development.png',
    desktopImgStyle: { left: '15.93%', top: '1.36%', width: '72.54%', height: '96.83%' },
    mobileIcon: '/images/for-developers/why/icon-development.png',
    mobileIconStyle: { left: '17px', top: '2px', width: '74px', height: '83px' },
    title: 'Slower Development Cycles',
    desc: 'Security bottlenecks delay releases and deployments.',
  },
];

/** Mobile card ordering — Figma reflows Remediation above Vulnerabilities. */
const MOBILE_ORDER = [0, 2, 1, 3] as const;

const DIVIDER_H =
  'linear-gradient(to right, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';
const DIVIDER_V =
  'linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';

function DesktopWhyCard({ desktopImg, desktopImgStyle, title, desc }: CardDef): React.ReactElement {
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
            src={desktopImg}
            alt=""
            className="absolute max-w-none"
            style={desktopImgStyle}
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
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#111111',
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
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function MobileWhyCard({ mobileIcon, mobileIconStyle, title, desc }: CardDef): React.ReactElement {
  return (
    <div
      className="relative bg-white flex flex-col items-center"
      style={{
        borderRadius: '24px',
        padding: '20px 24px 28px',
        boxShadow:
          '0 1px 2px rgba(17, 17, 17, 0.04), 0 12px 32px -8px rgba(17, 17, 17, 0.06)',
      }}
    >
      {/* ── Icon area (108×87 Figma frame) ── */}
      <div
        className="relative shrink-0"
        aria-hidden
        style={{ width: '108px', height: '87px' }}
      >
        {/* Purple glow — 79.75×79.75, blur 20.78, opacity 0.35 (Ellipse 46679) */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{
            left: '-1.45px',
            top: '0.24px',
            width: '79.75px',
            height: '79.75px',
            background: '#DF9BFF',
            opacity: 0.35,
            filter: 'blur(20.78px)',
            borderRadius: '50%',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileIcon}
          alt=""
          className="absolute max-w-none"
          style={{ ...mobileIconStyle, objectFit: 'contain' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Text ── */}
      <div className="flex flex-col items-center text-center" style={{ marginTop: '12px', gap: '12px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h4)',
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#000000',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 1.4,
            color: 'rgba(17, 17, 17, 0.8)',
            maxWidth: '260px',
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
      className="relative overflow-hidden"
      style={{ backgroundColor: '#F6F6F6' }}
    >
      {/* ── Left Union grid-pattern blob (Figma: left=-500, top=-539, w=1181) ── */}
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

      {/* ── Right Union grid-pattern blob (Figma: left=1216, top=-535, w=1101) ── */}
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

      {/* ── Top-left ellipse glow (Figma: left=-68, top=-76, 258px + inset-[-94.19%]) ── */}
      {/* Rendered size at 1920: 258 × (1 + 2×0.9419) ≈ 744px; center at (61, 53) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
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

      {/* ── Content ── */}
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
        {/* H2 — Figma desktop: 62px Manrope Bold tracking -3.1px · Figma mobile: 28px tracking 0 */}
        <h2
          className="text-center mx-auto"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            color: '#111111',
            marginBottom: 'clamp(32px, 4.17vw, 80px)',
          }}
        >
          Why Does It Matter
        </h2>

        {/* ── Mobile: single-column card stack ── */}
        <div className="flex flex-col gap-4 lg:hidden">
          {MOBILE_ORDER.map((idx) => (
            <MobileWhyCard key={`m-${idx}`} {...CARDS[idx as 0 | 1 | 2 | 3]} />
          ))}
        </div>

        {/* ── Desktop: 2×2 problem-card grid with gradient dividers ── */}
        <div className="relative hidden lg:block">
          {/* Vertical centre divider — Figma: 1px line at x=962 (page centre) */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: '50%',
              top: '4%',
              bottom: '4%',
              width: '1px',
              background: DIVIDER_V,
            }}
          />

          <div
            className="grid grid-cols-2"
            style={{ rowGap: 0, columnGap: 0 }}
          >
            {/* ── Row 1 ── */}
            <div style={{ paddingRight: '32px', paddingBottom: '48px' }}>
              <DesktopWhyCard {...CARDS[0]} />
            </div>
            <div style={{ paddingLeft: '32px', paddingBottom: '48px' }}>
              <DesktopWhyCard {...CARDS[1]} />
            </div>

            {/* Horizontal divider spanning both columns — Figma: 1234px × 1px at y=530 */}
            <div
              aria-hidden
              className="pointer-events-none"
              style={{
                gridColumn: '1 / -1',
                height: '1px',
                background: DIVIDER_H,
              }}
            />

            {/* ── Row 2 ── */}
            <div style={{ paddingRight: '32px', paddingTop: '48px' }}>
              <DesktopWhyCard {...CARDS[2]} />
            </div>
            <div style={{ paddingLeft: '32px', paddingTop: '48px' }}>
              <DesktopWhyCard {...CARDS[3]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
