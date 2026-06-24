import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

/*
 * WhyMattersGrid — shared layout for "problem cards" sections following the
 * for-developers "Why Does It Matter" pattern.
 *
 * Consumed by: DeveloperWhyItMatters (canonical reference), CleanStartImagesUVP,
 * SbomRisks, CleanSightProblems, ASRApproach, CisoRisks.
 *
 * At md+ the layout is a 2×2 grid with gradient hairline dividers; each card is
 * icon-left/text-right with a glow halo behind the icon. Below md it collapses
 * to a single column of white rounded tiles with the icon centered above the
 * text. The shared decoration assets live under /images/for-developers/why/.
 */

export interface WhyCard {
  /** 3D illustration shown in the icon slot on both desktop and mobile. */
  imgSrc: string;
  imgAlt?: string;
  /** Optional per-card absolute positioning of the img inside the overflow
   *  container. Defaults to an inset:0 + object-contain layout that works for
   *  any centered illustration. */
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
  /** Toggle the two top-corner purple ellipse glows. Defaults to true.
   *  Set false on pages where the colour wash doesn't belong (e.g. CleanSight). */
  showCornerGlows?: boolean;
  /** Toggle the top-left hex-grid blob. Defaults to true. */
  showLeftGrid?: boolean;
  /** Toggle the top-right hex-grid blob. Defaults to true. */
  showRightGrid?: boolean;
  /** Render a single soft purple radial gradient at top-right.
   *  Used on SbomRisks as a replacement for the corner glows. */
  showUnionTint?: boolean;
  /** Drop the #F6F6F6 wash entirely so the section is transparent and inherits
   *  whatever the section above paints (no visible colour seam). */
  flushBg?: boolean;
  /** Render the hex-grid blob at the bottom-left corner at reduced opacity.
   *  Used on ASRApproach where the rest of the decoration is suppressed. */
  showBottomLeftGrid?: boolean;
  /** Colour scheme. Defaults to 'light'. 'dark' paints an opaque dark-indigo
   *  background and flips heading/card/divider colours for a dark section. */
  theme?: 'light' | 'dark';
}

// Divider gradients — fade in from the edges, 20%→80% solid. Colour swaps with theme.
function dividerGradients(theme: 'light' | 'dark'): { horizontal: string; vertical: string } {
  const c = theme === 'dark' ? 'rgba(255,255,255,0.14)' : '#d9d9d9';
  return {
    horizontal: `linear-gradient(to right, transparent 0%, ${c} 20%, ${c} 80%, transparent 100%)`,
    vertical: `linear-gradient(to bottom, transparent 0%, ${c} 20%, ${c} 80%, transparent 100%)`,
  };
}

// Default crop for cards that don't ship per-card positioning.
const DEFAULT_IMG_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

function DesktopCard({
  imgSrc,
  imgAlt,
  imgStyle,
  title,
  desc,
  theme = 'light',
}: WhyCard & { theme?: 'light' | 'dark' }): React.ReactElement {
  const dark = theme === 'dark';
  return (
    <div className="flex items-center" style={{ gap: 'clamp(16px, 1.67vw, 24px)' }}>
      <div
        className="relative shrink-0"
        style={{
          width: 'clamp(120px, 11.8vw, 170px)',
          height: 'clamp(90px, 8.7vw, 125px)',
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

      <div className="flex flex-col min-w-0" style={{ flex: '1 1 0', gap: '17px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: dark ? '#ffffff' : '#111111',
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
            color: dark ? 'rgba(255,255,255,0.72)' : '#333333',
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function MobileCard({
  imgSrc,
  imgAlt,
  mobileImgStyle,
  title,
  desc,
  theme = 'light',
}: WhyCard & { theme?: 'light' | 'dark' }): React.ReactElement {
  const dark = theme === 'dark';
  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        borderRadius: '24px',
        padding: '20px 24px 28px',
        background: dark ? 'rgba(255,255,255,0.05)' : '#ffffff',
        border: dark ? '1px solid rgba(255,255,255,0.1)' : 'none',
        boxShadow: dark
          ? 'none'
          : '0 1px 2px rgba(17, 17, 17, 0.04), 0 12px 32px -8px rgba(17, 17, 17, 0.06)',
      }}
    >
      <div className="relative shrink-0" aria-hidden style={{ width: '108px', height: '87px' }}>
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

      <div className="flex flex-col items-center text-center" style={{ marginTop: '12px', gap: '12px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h4)',
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: dark ? '#ffffff' : '#000000',
            margin: 0,
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
            color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(17, 17, 17, 0.8)',
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
  showCornerGlows = true,
  showLeftGrid = true,
  showRightGrid = true,
  showUnionTint = false,
  flushBg = false,
  showBottomLeftGrid = false,
  theme = 'light',
}: WhyMattersGridProps): React.ReactElement {
  const isDark = theme === 'dark';
  const dividers = dividerGradients(theme);
  return (
    <section
      data-section={dataSection}
      className="relative overflow-hidden"
      style={{
        background: isDark
          ? // Canonical dark→blue→purple section gradient (shared across the
            // site's dark bands). Opaque, so it covers any light wrapper behind.
            'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)'
          : flushBg
            ? // Transparent — the caller is expected to wrap this section
              // (and the section above it) in a single bg-[#F6F6F6] container,
              // so both render against ONE continuous backdrop with no
              // FadeUp-induced sub-pixel seam between them.
              'transparent'
            : // Soft gradient blend at the top + bottom edges so the section
              // doesn't form a hard horizontal seam against whatever sits above
              // (typically a darker hero gradient) or below it.
              'linear-gradient(180deg, rgba(246,246,246,0) 0%, #F6F6F6 96px, #F6F6F6 calc(100% - 96px), rgba(246,246,246,0) 100%)',
      }}
    >
      {/* Left hex-grid blob — negative offsets let it bleed off-canvas intentionally. */}
      {showLeftGrid ? (
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
      ) : null}

      {/* Right hex-grid blob — bleeds off the right edge intentionally. */}
      {showRightGrid ? (
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
      ) : null}

      {/* Bottom-left hex-grid blob at reduced opacity. */}
      {showBottomLeftGrid ? (
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block"
          style={{
            left: 'calc(-500 / 1920 * 100vw)',
            bottom: 'calc(-539 / 1920 * 100vw)',
            width: 'calc(1181 / 1920 * 100vw)',
            height: 'calc(1181 / 1920 * 100vw)',
            opacity: 0.35,
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
      ) : null}

      {/* Soft purple radial gradient at top-right — single colour-wash
          decoration used on SbomRisks in place of the corner glows. */}
      {showUnionTint ? (
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block"
          style={{
            left: 'calc(1347 / 1920 * 100vw)',
            top: 'calc(-565 / 1920 * 100vw)',
            width: 'calc(1101 / 1920 * 100vw)',
            height: 'calc(1101 / 1920 * 100vw)',
            background:
              'radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100, 13, 251, 0) 100%)',
            opacity: 0.1,
          }}
        />
      ) : null}

      {/* Top-left + top-right ellipse glows (opt-out via showCornerGlows). */}
      {showCornerGlows ? (
        <>
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
        </>
      ) : null}

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
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              color: isDark ? '#ffffff' : '#111111',
              margin: 0,
            }}
          >
            {heading}
          </h2>
        </Reveal>

        {subheading ? (
          <Reveal header delay={0.15} y={20}>
            <p
              className="text-center mx-auto"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(17, 17, 17, 0.8)',
                maxWidth: '680px',
                marginTop: 'clamp(12px, 1.5vw, 20px)',
                marginBottom: 0,
              }}
            >
              {subheading}
            </p>
          </Reveal>
        ) : null}

        <div style={{ marginTop: 'clamp(32px, 4.17vw, 80px)' }}>
          {/* Mobile (< md): single-column stack. */}
          <div className="flex flex-col gap-4 md:hidden">
            {mobileOrder.map((idx) => {
              const card = cards[idx] ?? cards[0];
              return <MobileCard key={`m-${idx}`} {...card} theme={theme} />;
            })}
          </div>

          {/* Tablet + Desktop (≥ md): 2×2 grid with gradient cross dividers. */}
          <div className="relative hidden md:block">
            {/* Vertical centre divider */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: '50%',
                top: '4%',
                bottom: '4%',
                width: '1px',
                background: dividers.vertical,
              }}
            />

            <div className="grid grid-cols-2" style={{ rowGap: 0, columnGap: 0 }}>
              {/* Left column gets extra paddingLeft so its icon+text sits
                  closer to the vertical centre divider (mirrors how the
                  right column already hugs the divider naturally). */}
              <div
                style={{
                  paddingLeft: 'clamp(24px, 5vw, 96px)',
                  paddingRight: '24px',
                  paddingBottom: '28px',
                }}
              >
                <DesktopCard {...cards[0]} theme={theme} />
              </div>
              <div style={{ paddingLeft: '24px', paddingBottom: '28px' }}>
                <DesktopCard {...cards[1]} theme={theme} />
              </div>

              {/* Horizontal divider between rows */}
              <div
                aria-hidden
                className="pointer-events-none"
                style={{
                  gridColumn: '1 / -1',
                  height: '1px',
                  background: dividers.horizontal,
                }}
              />

              <div
                style={{
                  paddingLeft: 'clamp(24px, 5vw, 96px)',
                  paddingRight: '24px',
                  paddingTop: '28px',
                }}
              >
                <DesktopCard {...cards[2]} theme={theme} />
              </div>
              <div style={{ paddingLeft: '24px', paddingTop: '28px' }}>
                <DesktopCard {...cards[3]} theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
