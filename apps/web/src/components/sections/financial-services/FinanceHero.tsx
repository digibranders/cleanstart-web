import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroReveal } from '@/components/ui/Reveal';

/*
 * Financial services hero — the site's standard solution-page hero shell
 * (FipsHero / CisoHero): bg-cs-hero mesh, a gridline overlay, left-aligned
 * copy, a 3D artifact on the right, and a bottom fade into the white section
 * below. Copy is the proposal's, verbatim.
 */
export function FinanceHero(): React.ReactElement {
  return (
    <section
      data-section="FinanceHero"
      className="relative overflow-hidden bg-cs-hero md:min-h-[clamp(600px,44vw,660px)]"
    >
      {/* Gridline overlay — the shared hero decoration. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none select-none absolute left-0 top-0 w-full hidden md:block"
        style={{ height: '620px', objectFit: 'cover', opacity: 0.7 }}
        loading="eager"
        decoding="async"
      />

      {/* Commissioned hero artifact: the banking dashboard with its software
          components revealed and verified. It ships a real alpha channel, so it
          composites straight onto the gradient — no blend mode, and none of the
          stacking-context care that a screen-blended version needed. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none lg:block"
        style={{ maxWidth: 'var(--container-default)', height: '100%' }}
      >
        <div
          className="absolute right-0"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(460px, 44vw, 680px)',
            aspectRatio: '1100 / 826',
          }}
        >
          <Image
            src="/images/financial-services/hero-verified-dashboard.webp"
            alt=""
            fill
            sizes="(min-width: 1440px) 680px, 44vw"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Bottom fade blends the hero gradient into the white section below. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0"
        style={{
          height: '200px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)',
        }}
      />

      <div
        className="relative mx-auto flex max-w-[var(--container-default)] flex-col justify-center px-6 sm:px-10 md:min-h-[clamp(600px,44vw,660px)]"
        style={{
          paddingTop: 'calc(clamp(104px, 11vw, 168px) + var(--cs-header-extra))',
          paddingBottom: 'clamp(56px, 6vw, 96px)',
        }}
      >
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
                marginBottom: 'clamp(16px, 1.67vw, 24px)',
              }}
            >
              Built for Financial Software.{' '}
              <span className="cs-text-gradient-impact">Secure from the Foundation.</span>
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
                maxWidth: '620px',
                marginBottom: 'clamp(24px, 2.22vw, 32px)',
              }}
            >
              Financial institutions need confidence in the software powering critical
              applications. CleanStart establishes that confidence through secure, verified
              software artifacts.
            </p>
          </HeroReveal>

          <HeroReveal
            y={30}
            delay={0.3}
            duration={0.8}
            className="flex flex-col items-center gap-4 sm:flex-row md:items-start"
          >
            <Link
              href="/contact-us"
              className="cs-btn-glass"
              style={
                {
                  '--cs-btn-h': '44px',
                  '--cs-btn-px': '24px',
                  '--cs-btn-fs': '16px',
                } as React.CSSProperties
              }
            >
              Talk to a Security Expert
            </Link>
            <Link
              href="/resource-center"
              className="cs-btn-blue"
              style={
                {
                  '--cs-btn-h': '44px',
                  '--cs-btn-px': '24px',
                  '--cs-btn-fs': '16px',
                } as React.CSSProperties
              }
            >
              <span>Financial Service Brochure</span>
            </Link>
          </HeroReveal>
        </div>

        {/* Mobile — the same image, in flow below the CTAs. */}
        <div
          aria-hidden
          className="relative mx-auto mt-10 w-[min(92vw,460px)] lg:hidden"
          style={{ aspectRatio: '1100 / 826' }}
        >
          <Image
            src="/images/financial-services/hero-verified-dashboard.webp"
            alt=""
            fill
            sizes="(max-width: 1023px) 92vw, 460px"
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
}
