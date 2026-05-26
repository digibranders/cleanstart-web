import Image from 'next/image';
import Link from 'next/link';

/**
 * ASR Hero — pixel-perfect for both desktop (Figma 783:91) and mobile (Figma 920:609).
 *
 * Mobile specs (360px / node 920:609):
 *  - Content starts at top: 136px
 *  - Heading: Figtree Bold 32px / lh 1.2 / white
 *  - "Bigger Risk": gradient 98.23deg #9A51FF→#2CC1EB, tracking -1.6px
 *  - Description: Figtree Regular 16px / tracking -0.64px / opacity 0.8
 *  - CTA: px-24 py-12, border #dab6f3, 16px Medium, tracking -0.8px
 *  - Cards: hero-mobile-cards.png (BLOATED left @13px / CLEAN right @193px)
 */
export function ASRHero(): React.ReactElement {
  return (
    <section
      data-section="ASRHero"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(179.99deg, #151021 -25.7%, #10123E 31.16%, #131E8F 51.01%, #471EC0 68.71%, #471FC3 79.83%, rgba(70, 30, 191, 0.85) 85.02%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 98.92%)',
        minHeight: 'clamp(560px, 51vw, 824px)',
      }}
    >
      {/* 80px grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(19, 15, 38, 0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 15, 38, 0.55) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Purple radial blob — desktop only */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          right: '-2vw',
          top: '-80px',
          width: 'min(360px, 26vw)',
          height: 'min(360px, 26vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(122, 89, 255, 0.55) 0%, rgba(122, 89, 255, 0) 70%)',
          filter: 'blur(60px)',
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col lg:flex-row items-start lg:items-center gap-[29px] lg:gap-[40px]"
          style={{
            /* Mobile: 136px matches Figma node 920:609 top:136px offset */
            paddingTop: 'clamp(136px, 13vw, 229px)',
            paddingBottom: 'clamp(56px, 7vw, 100px)',
          }}
        >
          {/* ── Left: heading + description + CTA ── */}
          <div
            className="w-full lg:flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
            style={{
              maxWidth: '545px',
              gap: '24px' /* Figma: gap-[24px] between text-block and button */,
            }}
          >
            {/* Text block — heading + description share gap-[16px] (Figma) */}
            <div
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
              style={{ gap: '16px', width: '100%' }}
            >
              {/* H1 — Figma: Figtree Bold 32px / lh 1.2 on mobile */}
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 4.45vw, 64px)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'white',
                  margin: 0,
                }}
              >
                <span className="block">Bigger Images,</span>
                {/*
                 * Figma 920:609 gradient: 98.23deg #9A51FF(17.6%) → #2CC1EB(92.7%)
                 * tracking: -1.6px (Figma: tracking-[-1.6px] at 32px)
                 */}
                <span
                  style={{
                    background: 'linear-gradient(98.23deg, #9A51FF 17.617%, #2CC1EB 92.717%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    letterSpacing: '-1.6px',
                  }}
                >
                  Bigger Risk
                </span>
              </h1>

              {/* Description — Figma: Figtree Regular 16px, tracking -0.64px, opacity 0.8 */}
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(16px, 1.7vw, 24px)',
                  fontWeight: 400,
                  letterSpacing: '-0.04em',
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
             * CTA — Figma 920:609 exact specs:
             *   padding: 12px 24px (py-[12px] px-[24px])
             *   border: 1px solid #dab6f3 (lavender)
             *   border-radius: 8px
             *   font: Inter/Sans Medium 16px, tracking -0.8px (-0.05em)
             *   color: #111
             *   background: glass (rgba white + radial blue tints)
             */}
            <Link
              href="/cleanstart-images"
              className="cs-btn-glass"
              style={
                {
                  /* Override the height-based layout with explicit padding */
                  height: 'auto',
                  padding: '12px 24px',
                  /* Figma lavender border (replaces default white border) */
                  border: '1px solid #dab6f3',
                  /* Font overrides */
                  fontFamily: 'var(--font-sans)',
                  fontSize: '16px',
                  fontWeight: 500,
                  letterSpacing: '-0.05em',
                  /* Figma text color */
                  color: '#111111',
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

          {/* ── Desktop: side-by-side comparison cards ── */}
          <div className="hidden lg:block relative shrink-0" style={{ width: 'min(622px, 48vw)' }}>
            <Image
              src="/images/attack-surface-reduction/hero-cards.png"
              alt="BLOATED vs CLEAN image comparison: 1.2 GB / 247 packages / 89 HIGH CVEs vs 87 MB / 12 packages / 0 HIGH CVEs"
              width={622}
              height={437}
              sizes="(min-width: 1280px) 622px, 50vw"
              className="w-full h-auto"
              priority
            />
          </div>

          {/*
           * Mobile: combined cards export matches Figma 920:609 layout —
           * BLOATED card (168×226) at left:13px, CLEAN card (153×188) at left:193px
           * Both are baked into hero-mobile-cards.png as a single composite.
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
