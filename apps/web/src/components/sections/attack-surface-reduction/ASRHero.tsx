import Image from 'next/image';
import Link from 'next/link';

/**
 * ASR Hero — pixel-perfect for both desktop (Figma 783:90) and mobile (Figma 920:609).
 *
 * Desktop specs (1440px / node 783:90):
 *  - Section height: 823px · bg gradient identical to mobile
 *  - Mesh background: hero-mesh.svg 1920×569px at left:-240px (overflows both edges)
 *  - Content position: left 82px · top 229px
 *  - Heading: Figtree SemiBold 80px / lh 1.2 / tracking -0.05em
 *  - "Bigger Risk": gradient 96.33deg #9A51FF 1.76% → #2CC1EB 98.78%
 *  - Description: Figtree Regular 30px / tracking -0.04em / opacity 0.8
 *  - CTA: px-18px py-9px · font Inter Medium 18px / tracking -0.01em · border #dab6f3 · glass
 *  - Content → CTA gap: 40px · Heading → Desc gap: 24px
 *  - BLOATED card: hero-cards.png (484×493 natural) · CLEAN card: JSX 295×362px
 *    BLOATED at wrapper left:0 top:0, CLEAN at wrapper left:325px top:77px
 *
 * Mobile specs (360px / node 920:609):
 *  - Content starts at top: 136px
 *  - Heading: Figtree Bold 32px / lh 1.2 / white
 *  - "Bigger Risk": gradient 98.23deg #9A51FF→#2CC1EB, tracking -1.6px
 *  - Description: Figtree Regular 16px / tracking -0.64px / opacity 0.8
 *  - CTA: px-24px py-12px · border #dab6f3 · 16px Medium · tracking -0.8px
 *  - Cards: hero-mobile-cards.png composite
 *
 * CTA note: cs-btn-glass is unlayered CSS (beats @layer utilities), so padding / font-size
 * MUST be set via inline style — Tailwind responsive classes like py-[9px] won't win.
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
       * Desktop mesh — 1920×569px SVG positioned at left:-240px so it overflows
       * 240px on each side of the 1440px viewport. overflow-hidden on the section clips it.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block max-w-none"
        src="/images/attack-surface-reduction/hero-mesh.svg"
        alt=""
        style={{ left: '-240px', top: 0, width: '1920px', height: '569px' }}
        loading="eager"
        decoding="async"
      />

      {/* Mobile grid overlay — subtle dark crosshatch, hidden at lg+ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(19, 15, 38, 0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 15, 38, 0.55) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
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

      {/*
       * Container: px-6 mobile · sm:px-10 tablet · lg:px-[82px] desktop
       * At 1440px viewport the content left edge lands at exactly 82px.
       */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 lg:px-[82px]">
        <div
          className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10"
          style={{
            paddingTop: 'clamp(136px, 15.9vw, 229px)',
            paddingBottom: 'clamp(56px, 8.3vw, 120px)',
          }}
        >
          {/* ── Left: heading + description + CTA ── */}
          <div
            className="w-full lg:flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 lg:gap-10"
            style={{ maxWidth: '545px' }}
          >
            {/* Text block — heading + description */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 lg:gap-6 w-full">
              {/*
               * H1: 32px Bold mobile → 80px SemiBold desktop
               * Tracking: -0.05em works at both sizes.
               */}
              <h1
                className="text-[32px] font-bold lg:font-semibold lg:[font-size:var(--text-hero-product)]"
                style={{
                  fontFamily: 'var(--font-display)',
                  letterSpacing: 'var(--text-hero-product-ls, -0.04em)',
                  lineHeight: 'var(--text-hero-lh, 1.05)',
                  color: 'white',
                  margin: 0,
                }}
              >
                <span className="block">Bigger Images,</span>
                <span
                  style={{
                    background: 'linear-gradient(96.33deg, #9A51FF 1.76%, #2CC1EB 98.78%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Bigger Risk
                </span>
              </h1>

              {/*
               * Description: 16px mobile → 30px desktop
               * Tracking: -0.04em = -0.64px at 16px = -1.2px at 30px
               */}
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
            </div>

            {/*
             * CTA — inline style overrides are required because cs-btn-glass is unlayered CSS
             * and beats @layer utilities (Tailwind). Desktop: 18px / py-9px px-18px.
             * Mobile: 16px / py-12px px-24px (served by the same inline style at all viewports —
             * both sizes are close enough visually; a JS media-query could split them if needed).
             */}
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

          {/* ── Desktop: BLOATED + CLEAN cards side-by-side ── */}
          {/*
           * The wrapper is a relative container sized to hold both absolutely-positioned cards.
           * BLOATED card (hero-cards.png 484×493 natural) at left=0 top=0, rendered 330px wide.
           * CLEAN card (JSX, 295×362px) at left=325px top=77px — Figma delta between card origins.
           * Wrapper: 620px wide (325+295), 450px tall (77+362+buffer).
           */}
          <div
            className="hidden lg:flex relative shrink-0"
            style={{ width: '620px', height: '450px' }}
          >
            {/* BLOATED card */}
            <div style={{ position: 'absolute', left: 0, top: 0 }}>
              <Image
                src="/images/attack-surface-reduction/hero-cards.png"
                alt="BLOATED image: 1.2 GB, 247 packages, 89 HIGH CVEs"
                width={484}
                height={493}
                sizes="330px"
                style={{ width: '330px', height: 'auto' }}
                priority
              />
            </div>

            {/* CLEAN card */}
            <div
              style={{
                position: 'absolute',
                left: '325px',
                top: '77px',
                width: '295px',
                height: '362px',
                background: 'linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)',
                border: '2.345px solid #dab6f3',
                borderRadius: '18.762px',
                boxShadow:
                  '-6.254px 3.127px 15.635px 0px rgba(0,0,0,0.23), -25.798px 12.508px 28.925px 0px rgba(0,0,0,0.2), -57.85px 28.925px 38.306px 0px rgba(0,0,0,0.12), -102.41px 50.814px 46.123px 0px rgba(0,0,0,0.03)',
                overflow: 'hidden',
              }}
            >
              {/* Glass shimmer overlay */}
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

              {/* Content layer */}
              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                {/* 87 MB size badge — top-left */}
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '16px',
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
                      fontSize: '12.528px',
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
                    left: '220px',
                    top: '16px',
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

                {/* CleanStart geometric "N" logo — centred in card body */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/attack-surface-reduction/hero-clean-logo.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '94px',
                    top: '120px',
                    width: '105px',
                    height: '121px',
                  }}
                  loading="lazy"
                  decoding="async"
                />

                {/* PACKAGES stat — bottom-left */}
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '311px',
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

                {/* CVES stat — bottom-right area */}
                <div
                  style={{
                    position: 'absolute',
                    left: '195px',
                    top: '311px',
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

          {/* ── Mobile: combined cards export ── */}
          {/*
           * hero-mobile-cards.png matches Figma 920:609 layout —
           * BLOATED card (168×226) at left:13px, CLEAN card (153×188) at left:193px.
           */}
          <div className="block lg:hidden relative w-full">
            <Image
              src="/images/attack-surface-reduction/hero-mobile-cards.png"
              alt="BLOATED vs CLEAN image comparison: 1.2 GB / 247 packages / 89 HIGH CVEs vs 87 MB / 12 packages / 0 HIGH CVEs"
              width={334}
              height={227}
              sizes="100vw"
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
