import Image from 'next/image';
import Link from 'next/link';

/**
 * ASR Hero — Figma node 783:91
 *
 * Background:
 *  - Vertical gradient: #151021 → #10123E → #131E8F → #471EC0 → fade to transparent.
 *  - 80px CSS grid overlay (#130F26 lines on the dark base).
 *  - Purple #7A59FF radial blob top-right (heavy blur).
 *
 * Content:
 *  - Heading "Bigger Images, Bigger Risk" — "Bigger Risk" in cyan→purple gradient.
 *  - Body copy: "CleanStart Images reduce attack surface by eliminating
 *    unnecessary components before they enter production."
 *  - Glass CTA "Explore Cleanstart Images" — .cs-btn-glass utility.
 *  - Right side: bloated-vs-clean comparison card image (hero-cards.png).
 *
 * Per request: colours / images / CTA style / gradients match Figma exactly,
 * but pixel sizes use the responsive token system (no hard-coded 1440 px).
 */
export function ASRHero(): React.ReactElement {
  return (
    <section
      data-section="ASRHero"
      className="relative overflow-hidden"
      style={{
        // Figma gradient (verbatim): 179.99deg navy → blue → purple → fade-out.
        background:
          'linear-gradient(179.99deg, #151021 -25.7%, #10123E 31.16%, #131E8F 51.01%, #471EC0 68.71%, #471FC3 79.83%, rgba(70, 30, 191, 0.85) 85.02%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 98.92%)',
        minHeight: 'clamp(560px, 51vw, 824px)',
      }}
    >
      {/* Background grid overlay — Figma uses 71.11 px squares with #130F26
          lines. We use 80 px on the 1px-line variable so it tiles cleanly with
          the rest of the site's hero grid utility (.bg-cs-grid is similar). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(19, 15, 38, 0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 15, 38, 0.55) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Purple radial blob — Figma Ellipse 46639 (top-right, soft, blurred) */}
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

      {/* Bottom purple-to-transparent fade so the hero glides into the next
          section instead of cutting hard at the section edge. */}
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
          className="flex flex-col lg:flex-row items-start lg:items-center"
          style={{
            paddingTop: 'clamp(120px, 13vw, 229px)',
            paddingBottom: 'clamp(56px, 7vw, 100px)',
            gap: '40px',
          }}
        >
          {/* Left: copy — heading + body + CTA */}
          <div
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
            style={{ maxWidth: '545px' }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-hero-product)',
                fontWeight: 600,
                letterSpacing: 'var(--text-hero-product-ls, -0.04em)',
                lineHeight: 'var(--text-hero-lh, 1.05)',
                color: 'white',
              }}
            >
              <span className="block">Bigger Images,</span>
              <span className="cs-text-gradient-impact">Bigger Risk</span>
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-t-subhead)',
                fontWeight: 400,
                letterSpacing: 'var(--text-t-subhead-ls)',
                lineHeight: 'var(--text-t-subhead-lh)',
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: '20px',
                maxWidth: '480px',
              }}
            >
              CleanStart Images reduce attack surface by eliminating unnecessary components before
              they enter production.
            </p>

            {/* CTA — shared .cs-btn-glass utility (matches every other hero) */}
            <Link
              href="/cleanstart-images"
              className="cs-btn-glass"
              style={
                {
                  marginTop: 'clamp(24px, 3vw, 40px)',
                  '--cs-btn-px': '18px',
                  '--cs-btn-fs': '18px',
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

          {/* Right: bloated-vs-clean comparison cards (combined Figma export) */}
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

          {/* Mobile-only: smaller card image */}
          <div className="block lg:hidden relative w-full">
            <Image
              src="/images/attack-surface-reduction/hero-mobile-cards.png"
              alt="BLOATED vs CLEAN image comparison"
              width={622}
              height={437}
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
