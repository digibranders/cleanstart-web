import type React from 'react';

/*
 * WhyMattersGrid — shared layout for "problem cards" sections that follow the
 * for-developers "Why Does It Matter" pattern (Figma node 798:2209).
 *
 * Consumed by:
 *   • DeveloperWhyItMatters         (canonical visual reference)
 *   • CleanStartImagesUVP           (Smaller Images. Lower Risk.)
 *   • SbomRisks                     (Static SBOMs Create Blind Spots)
 *   • CleanSightProblems            (When Container Visibility Falls Short, Risk Grows)
 *   • ASRApproach                   (The CleanStart Approach)
 *   • CisoRisks                     (Most Container Risk Is Inherited)
 *
 * Visual contract:
 *   • Section bg: #F6F6F6 with two large hex-grid blob SVGs (top corners) and
 *     two soft purple glow ellipses (top corners). All four are hidden < lg.
 *   • Heading: 28→56px Manrope Bold tracking -0.04em, #111, centered.
 *   • Optional subheading: 14→18px Sora 400, opacity 0.8, centered below H2.
 *   • Desktop (≥ lg): 2×2 grid with 1px gradient hairline dividers — vertical
 *     center line + horizontal between rows. Each card is icon-left/text-right,
 *     with a purple glow halo behind the icon.
 *   • Mobile (< lg): single column, each card becomes a white rounded tile
 *     with shadow; icon centered above, text centered below.
 *
 * The decoration assets live under /images/for-developers/why/ and are shared
 * across all consumers so we don't ship 5 copies of the same SVGs.
 */

export interface WhyCard {
  /** 3D illustration shown in the icon slot on both desktop and mobile. */
  imgSrc: string;
  imgAlt?: string;
  /** Optional per-card absolute positioning of the img inside the overflow
   *  container (matches Figma per-card crops). Defaults to a sensible
   *  inset:0 + object-contain layout that works for any centered illustration. */
  imgStyle?: React.CSSProperties;
  /** Optional per-card mobile-only positioning override. */
  mobileImgStyle?: React.CSSProperties;
  title: string;
  desc: string;
}

export interface WhyMattersGridProps {
  /** Section-level data-attribute (for QA / analytics targeting). */
  dataSection: string;
  /** Heading content — JSX so callers can colour-gradient specific words. */
  heading: React.ReactNode;
  /** Optional one-line subheading rendered between H2 and the grid. */
  subheading?: React.ReactNode;
  /** Exactly four cards (will render in row-major order: TL, TR, BL, BR). */
  cards: readonly [WhyCard, WhyCard, WhyCard, WhyCard];
  /** Mobile re-order indices (defaults to source order). */
  mobileOrder?: readonly [number, number, number, number];
}

// ── Divider gradients (fade in from the edges, 20%→80% solid) ────────────────
const DIVIDER_H =
  'linear-gradient(to right, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';
const DIVIDER_V =
  'linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';

// ── Default crop for cards that don't ship per-card positioning ──────────────
const DEFAULT_IMG_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

function DesktopCard({ imgSrc, imgAlt, imgStyle, title, desc }: WhyCard): React.ReactElement {
  return (
    <div className="flex items-center" style={{ gap: 'clamp(16px, 1.67vw, 24px)' }}>
      {/* ── Illustration area (222×165 max, scales down to 160×120) ── */}
      <div
        className="relative shrink-0"
        style={{
          width: 'clamp(160px, 15.4vw, 222px)',
          height: 'clamp(120px, 11.46vw, 165px)',
        }}
      >
        {/* Purple glow halo behind the icon */}
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
            loading="lazy"
            decoding="async"
          />
        </div>
        {/* 3D illustration — clipped to container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={imgAlt ?? ''}
            className="absolute max-w-none"
            style={imgStyle ?? DEFAULT_IMG_STYLE}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Title + description ── */}
      <div className="flex flex-col min-w-0" style={{ flex: '1 1 0', gap: '17px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 2.4vw, 32px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#111111',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(15px, 1.4vw, 20px)',
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

function MobileCard({ imgSrc, imgAlt, mobileImgStyle, title, desc }: WhyCard): React.ReactElement {
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
      <div className="relative shrink-0" aria-hidden style={{ width: '108px', height: '87px' }}>
        {/* Purple glow — 79.75×79.75, blur 20.78, opacity 0.35 */}
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
          src={imgSrc}
          alt={imgAlt ?? ''}
          className="absolute max-w-none"
          style={
            mobileImgStyle ?? {
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '90px',
              maxHeight: '80px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }
          }
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Title + description ── */}
      <div className="flex flex-col items-center text-center" style={{ marginTop: '12px', gap: '12px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#000000',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 1.4,
            color: 'rgba(17, 17, 17, 0.8)',
            maxWidth: '260px',
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export function WhyMattersGrid({
  dataSection,
  heading,
  subheading,
  cards,
  mobileOrder = [0, 1, 2, 3],
}: WhyMattersGridProps): React.ReactElement {
  return (
    <section
      data-section={dataSection}
      className="relative overflow-hidden"
      style={{ backgroundColor: '#F6F6F6' }}
    >
      {/* ── Left hex-grid blob (Figma: left=-500, top=-539, w=1181) ── */}
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

      {/* ── Right hex-grid blob (Figma: left=1216, top=-535, w=1101) ── */}
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

      {/* ── Top-left ellipse glow ── */}
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

      {/* ── Top-right ellipse glow ── */}
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
        <h2
          className="text-center mx-auto"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            color: '#111111',
            margin: 0,
          }}
        >
          {heading}
        </h2>

        {subheading ? (
          <p
            className="text-center mx-auto"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(14px, 1.25vw, 18px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: 'rgba(17, 17, 17, 0.8)',
              maxWidth: '680px',
              marginTop: 'clamp(12px, 1.5vw, 20px)',
              marginBottom: 0,
            }}
          >
            {subheading}
          </p>
        ) : null}

        <div style={{ marginTop: 'clamp(32px, 4.17vw, 80px)' }}>
          {/* ── Mobile (< lg): single-column stack ── */}
          <div className="flex flex-col gap-4 lg:hidden">
            {mobileOrder.map((idx) => {
              const card = cards[idx] ?? cards[0];
              return <MobileCard key={`m-${idx}`} {...card} />;
            })}
          </div>

          {/* ── Desktop (≥ lg): 2×2 grid with gradient cross dividers ── */}
          <div className="relative hidden lg:block">
            {/* Vertical centre divider */}
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

            <div className="grid grid-cols-2" style={{ rowGap: 0, columnGap: 0 }}>
              <div style={{ paddingRight: '32px', paddingBottom: '48px' }}>
                <DesktopCard {...cards[0]} />
              </div>
              <div style={{ paddingLeft: '32px', paddingBottom: '48px' }}>
                <DesktopCard {...cards[1]} />
              </div>

              {/* Horizontal divider between rows */}
              <div
                aria-hidden
                className="pointer-events-none"
                style={{
                  gridColumn: '1 / -1',
                  height: '1px',
                  background: DIVIDER_H,
                }}
              />

              <div style={{ paddingRight: '32px', paddingTop: '48px' }}>
                <DesktopCard {...cards[2]} />
              </div>
              <div style={{ paddingLeft: '32px', paddingTop: '48px' }}>
                <DesktopCard {...cards[3]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
