import type React from 'react';
import Link from 'next/link';
import { HeroReveal } from '@/components/ui/Reveal';
import { FinanceHeroVisual } from './FinanceHeroVisual';

/*
 * Financial-services hero — the site's standard dark gradient band with the
 * bespoke "Verified Foundation" SVG on the right (desktop) and a left-aligned
 * headline + glass CTA. Same band gradient and header-clearance math as the
 * other solutions heroes, so the page docks into the existing system rather
 * than inventing a second hero language.
 */
export function FinanceHero(): React.ReactElement {
  return (
    <section
      data-section="FinanceHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{
        minHeight: 'clamp(480px, 40vw, 652px)',
        backgroundImage:
          'linear-gradient(180deg, #151021 25.702%, #10123e 31.159%, #131e8f 51.006%, #471ec0 68.711%, #471fc3 79.832%, rgba(70,30,191,0.85) 85.018%, rgba(66,30,188,0.4) 93.72%, rgba(66,30,188,0) 98.921%)',
      }}
    >
      <div
        className="relative mx-auto z-[2] flex w-full max-w-[var(--container-default)] flex-col justify-center"
        style={{
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'calc(72px + var(--cs-header-extra))',
          paddingBottom: '0px',
          minHeight: 'clamp(480px, 40vw, 652px)',
        }}
      >
        {/* Foundation visual — desktop only. Inside the container so its right
            edge respects the site gutter and the 1440 cap; vector and
            container-relative, so it scales cleanly at every viewport. */}
        <div
          className="absolute pointer-events-none select-none hidden lg:block z-[1]"
          style={{
            top: '54%',
            right: 'clamp(16px, 4vw, 48px)',
            transform: 'translateY(-50%)',
            width: 'clamp(400px, 38vw, 580px)',
            aspectRatio: '600 / 470',
          }}
        >
          <FinanceHeroVisual />
        </div>

        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: '700px' }}
        >
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-display)',
                fontWeight: 600,
                letterSpacing: 'var(--text-hero-product-ls, -0.04em)',
                lineHeight: 'var(--text-hero-lh, 1.05)',
                marginBottom: 'clamp(16px, 1.67vw, 32px)',
              }}
            >
              Built for Financial Software. Secure from the Foundation.
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.45,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 'clamp(24px, 1.67vw, 32px)',
              }}
            >
              Financial institutions need confidence in the software powering critical applications.
              CleanStart establishes that confidence through secure, verified software artifacts.
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.3} duration={0.8} className="self-center md:self-start">
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <Link
                href="/contact-us"
                className="cs-btn-glass cs-fin-hero-cta"
                style={
                  {
                    '--cs-btn-fs': 'clamp(16px, 1.04vw, 20px)',
                    '--cs-btn-h': '44px',
                    '--cs-btn-px': '22px',
                  } as React.CSSProperties
                }
              >
                Talk to a Security Expert
              </Link>
              <Link
                href="/resource-center"
                className="cs-fin-hero-link"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(15px, 1.04vw, 18px)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
              >
                Financial Services Brochure
              </Link>
            </div>
          </HeroReveal>

          {/* The foundation drawing is the page's one finance-specific asset;
              gating it at lg meant every phone reader got the page without its
              thesis. Below lg it sits under the actions instead of beside them. */}
          <HeroReveal y={30} delay={0.4} duration={0.9} className="w-full lg:hidden">
            <div
              aria-hidden
              className="pointer-events-none mx-auto select-none"
              style={{
                marginTop: 'clamp(32px, 8vw, 48px)',
                width: 'min(100%, 420px)',
                aspectRatio: '600 / 470',
              }}
            >
              <FinanceHeroVisual />
            </div>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
