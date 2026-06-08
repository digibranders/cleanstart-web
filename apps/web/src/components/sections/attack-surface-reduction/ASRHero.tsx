import Image from 'next/image';
import Link from 'next/link';
import { HeroReveal } from '@/components/ui/Reveal';

/**
 * ASR Hero — BLOATED vs CLEAN comparison cards beside the headline.
 *
 * CTA note: cs-btn-glass is unlayered CSS (beats @layer utilities), so padding
 * and font-size MUST be set via inline style — Tailwind responsive classes
 * like py-[9px] won't win.
 */
export function ASRHero(): React.ReactElement {
  return (
    <section
      data-section="ASRHero"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(179.99deg, #151021 25.7%, #10123E 31.16%, #131E8F 51.01%, #471EC0 68.71%, #471FC3 79.83%, rgba(70, 30, 191, 0.85) 85.02%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 98.92%)',
        minHeight: 'clamp(560px, 51vw, 824px)',
      }}
    >
      {/*
       * Grid mesh — same hero-mesh.svg across all viewports. On md+ it is
       * positioned so it overflows each side of the viewport; on mobile the
       * SVG's baked-in preserveAspectRatio="none" stretches it to full width
       * so the grid stays continuous. overflow-hidden on the section clips it.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute left-0 top-0 w-full h-[400px] md:hidden"
        src="/images/attack-surface-reduction/hero-mesh.svg"
        alt=""
        loading="eager"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block max-w-none"
        src="/images/attack-surface-reduction/hero-mesh.svg"
        alt=""
        style={{ left: '-240px', top: 0, width: '1920px', height: '569px' }}
        loading="eager"
        decoding="async"
      />

      {/* Bottom purple fade into next section */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute bottom-0 left-0 right-0"
        style={{
          height: '180px',
          background: 'linear-gradient(180deg, rgba(71,30,192,0) 0%, rgba(120,60,255,0.35) 100%)',
          mixBlendMode: 'screen',
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 lg:px-[82px]">
        <div
          className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-6 lg:gap-10"
          style={{
            // Match FipsHero top padding so the H1 baseline lines up across product heroes.
            paddingTop: 'calc(clamp(112px, 12.92vw, 200px) + var(--cs-header-extra))',
            // Fixed bottom space below the cards/CTA at every viewport so the
            // gap doesn't shift with width.
            paddingBottom: '96px',
          }}
        >
          {/* Left: heading + description + CTA */}
          <div
            className="w-full md:flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 md:gap-6 lg:gap-10"
            style={{ maxWidth: '545px' }}
          >
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 md:gap-5 lg:gap-6 w-full">
              <HeroReveal y={50} duration={1.0}>
                <h1
                  className="font-bold lg:font-semibold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-display)',
                    letterSpacing: 'var(--fs-display-ls)',
                    lineHeight: 'var(--fs-display-lh)',
                    color: 'white',
                    margin: 0,
                  }}
                >
                  <span className="block">Bigger Images,</span>
                  <span className="block">Bigger Risk</span>
                </h1>
              </HeroReveal>

              <HeroReveal y={30} delay={0.2} duration={0.8}>
                <p
                  className="text-base lg:[font-size:var(--text-t-subhead)]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                    color: 'rgba(255, 255, 255, 0.8)',
                    maxWidth: '480px',
                    margin: 0,
                  }}
                >
                  CleanStart Images reduce attack surface by eliminating unnecessary components before
                  they enter production.
                </p>
              </HeroReveal>
            </div>

            {/* Inline style overrides are required because cs-btn-glass is
                unlayered CSS and beats @layer utilities (Tailwind). */}
            <Link
              href="https://images.cleanstart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-btn-glass"
              style={
                {
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: '#111111',
                  height: 'auto',
                  padding: '9px 18px',
                  border: '1px solid #dab6f3',
                } as React.CSSProperties
              }
            >
              Explore Cleanstart Images
              <svg
                className="cs-cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Tablet + Desktop: BLOATED + CLEAN cards side-by-side. */}
          {/*
           * Stage system: cards are authored at a fixed 650×440 "design canvas"
           * and CSS-scaled uniformly via --asr-card-scale. The OUTER div reserves
           * the post-scale footprint so flex layout is honest; the INNER div
           * renders the design-size canvas and transforms it down, preserving
           * every absolute-positioned interior coordinate.
           *
           * Two regimes:
           *   • Mobile (<md): scale is computed so the VISIBLE card span
           *     (BLOATED visible-left → CLEAN visible-right = 586 canvas units)
           *     fills the container's content width (100vw - 48px, where 48px
           *     is the section's px-6 gutter * 2). A negative left margin
           *     (-64px * scale) shifts the wrapper so BLOATED's visible-left
           *     sits flush with the left gutter and CLEAN's visible-right
           *     sits flush with the right gutter. Heights derive from the
           *     same scale → fully fluid.
           *   • md+ : viewport clamp 0.5 → 1.0 across 768 → 1440vw.
           * Both use CSS Values 4 px-over-px division for unitless ratios.
           */}
          <div
            className={[
              'block relative shrink-0',
              'w-full md:w-auto',
              '-ml-[calc(64px*var(--asr-card-scale))] md:ml-0',
              '[--asr-card-scale:calc((100vw-48px)/586px)]',
              'md:[--asr-card-scale:clamp(0.5,calc(0.5+(100vw-768px)/672px*0.5),1)]',
            ].join(' ')}
            style={{
              width: 'calc(650px * var(--asr-card-scale))',
              // Height excludes the ≈26px drop-shadow padding baked into hero-cards.webp
              // so the wrapper's bottom edge = the cards' VISIBLE bottom. items-end on
              // the parent flex row then pins that to the CTA's bottom on md+.
              height: 'calc(414px * var(--asr-card-scale))',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '650px',
                height: '440px',
                transform: 'scale(var(--asr-card-scale))',
                transformOrigin: 'top left',
              }}
            >
            {/* BLOATED card — larger, bottom-aligned, on the left. */}
            <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
              <Image
                src="/images/attack-surface-reduction/hero-cards.webp"
                alt="BLOATED image: 1.2 GB, 247 packages, 89 HIGH CVEs"
                width={484}
                height={493}
                sizes="430px"
                style={{ width: '430px', height: 'auto' }}
                priority
              />
            </div>

            {/* CLEAN card — smaller, visually bottom-aligned with BLOATED. The
                hero-cards.webp carries ~26px of drop-shadow padding below its
                visible frame at the rendered width, so CLEAN's bottom:26px
                matches BLOATED's visible bottom exactly. */}
            <div
              style={{
                position: 'absolute',
                left: '390px',
                bottom: '26px',
                width: '260px',
                height: '320px',
                background: 'linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)',
                border: '2.345px solid #dab6f3',
                borderRadius: '18.762px',
                boxShadow:
                  '-6.254px 3.127px 15.635px 0px rgba(0,0,0,0.23), -25.798px 12.508px 28.925px 0px rgba(0,0,0,0.2), -57.85px 28.925px 38.306px 0px rgba(0,0,0,0.12), -102.41px 50.814px 46.123px 0px rgba(0,0,0,0.03)',
                overflow: 'hidden',
              }}
            >
              {/* Glass shimmer overlay. */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  background:
                    'linear-gradient(to right, rgba(217,217,217,0.25), rgba(50,50,50,0))',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                {/* 87 MB size badge — top-left */}
                <div
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '14px',
                    border: '0.785px solid #dab6f3',
                    borderRadius: '23.491px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '11px',
                      color: 'white',
                      lineHeight: 1,
                    }}
                  >
                    87 MB
                  </span>
                </div>

                {/* CLEAN status badge — top-right area */}
                <div
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '14px',
                    border: '0.785px solid #dab6f3',
                    borderRadius: '23.491px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: '7.818px',
                      height: '7.818px',
                      borderRadius: '50%',
                      background: '#4aff2e',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: '10.945px',
                      color: 'white',
                      lineHeight: 1,
                    }}
                  >
                    CLEAN
                  </span>
                </div>

                {/* Logo backdrop — green blur ellipse */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    width: '55.67px',
                    height: '59.65px',
                    left: '45.3px',
                    top: '58.91px',
                    background: '#4AFF2E',
                    filter: 'blur(31.7874px)',
                    transform: 'rotate(18.37deg)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Logo backdrop — soft radial wash */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    width: '136.25px',
                    height: '136.25px',
                    left: 'calc(50% - 136.25px / 2 - 19.23px)',
                    top: 'calc(50% - 136.25px / 2 - 18.55px)',
                    background:
                      'radial-gradient(50% 50% at 50% 50%, rgba(28, 163, 111, 0.5) 0%, rgba(5, 132, 83, 0) 100%)',
                    transform: 'rotate(18.37deg)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Logo backdrop — etched gridline pattern */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  alt=""
                  src="/images/attack-surface-reduction/hero-clean-gridline.svg"
                  style={{
                    position: 'absolute',
                    width: '154px',
                    height: '167px',
                    left: 'calc(50% - 154px / 2 - 19.23px)',
                    top: 'calc(50% - 167px / 2 - 18.55px)',
                    pointerEvents: 'none',
                  }}
                  loading="lazy"
                  decoding="async"
                />

                {/* CleanStart geometric "N" logo — centred in card body. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/attack-surface-reduction/hero-clean-logo.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '84px',
                    top: '102px',
                    width: '92px',
                    height: '107px',
                  }}
                  loading="lazy"
                  decoding="async"
                />

                {/* PACKAGES stat — bottom-left */}
                <div
                  style={{
                    position: 'absolute',
                    left: '11px',
                    bottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    PACKAGES
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '12.508px',
                      color: '#4aff2e',
                      lineHeight: 1,
                    }}
                  >
                    12
                  </span>
                </div>

                {/* CVES stat — bottom-right area. */}
                <div
                  style={{
                    position: 'absolute',
                    right: '11px',
                    bottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    CVES
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '12.508px',
                      color: '#4aff2e',
                      lineHeight: 1,
                    }}
                  >
                    0 HIGH
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
