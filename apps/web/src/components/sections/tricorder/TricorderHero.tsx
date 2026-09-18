import Link from 'next/link';

import { HeroReveal } from '@/components/ui/Reveal';
import { TricorderHeroVerdict } from './TricorderHeroVerdict';

/**
 * Tricorder hero, on the solution-page hero shell (FinanceHero / SaasHero):
 * bg-cs-hero mesh, gridline overlay, left-aligned copy with the gradient
 * accent, an artifact on the right and a fade into the white section below.
 *
 * The artifact is the verdict loop (TricorderHeroVerdict), built in code: one
 * package examined by the four stages and judged before it is trusted. It is
 * decorative, so phones drop it rather than stack it under the headline, as
 * the other solution heroes do.
 */
export function TricorderHero(): React.ReactElement {
  return (
    <section data-section="TricorderHero" className="relative overflow-hidden bg-cs-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-0 hidden w-full select-none md:block"
        style={{ height: '620px', objectFit: 'cover', opacity: 0.7 }}
        loading="eager"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none"
        style={{
          height: '200px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)',
        }}
      />

      <div
        className="relative mx-auto grid max-w-[var(--container-default)] items-center gap-8 px-6 pb-[96px] sm:px-10 md:pb-[clamp(160px,13vw,200px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10"
        style={{
          paddingTop: 'calc(clamp(104px, 10vw, 150px) + var(--cs-header-extra))',
        }}
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-display)',
                fontWeight: 600,
                letterSpacing: 'var(--text-hero-product-ls, -0.04em)',
                lineHeight: 'var(--text-hero-lh, 1.05)',
                maxWidth: '640px',
              }}
            >
              The Intelligence Layer{' '}
              <span className="cs-text-gradient-impact inline-block">for Software Trust</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              className="text-white/80"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.45,
                maxWidth: '520px',
                marginTop: 'clamp(18px, 1.8vw, 24px)',
                textWrap: 'balance',
              }}
            >
              Understand Every Software Dependency Before Trusting It.
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.3} duration={0.8}>
            <Link
              href="/contact-us"
              className="cs-btn-blue"
              style={
                {
                  '--cs-btn-h': '44px',
                  '--cs-btn-px': '24px',
                  '--cs-btn-fs': '16px',
                  marginTop: 'clamp(28px, 2.6vw, 36px)',
                } as React.CSSProperties
              }
            >
              <span>Talk to an Expert</span>
            </Link>
          </HeroReveal>
        </div>

        <HeroReveal
          y={40}
          delay={0.2}
          duration={1.0}
          className="mx-auto hidden w-full max-w-[440px] md:block lg:max-w-[520px]"
        >
          <TricorderHeroVerdict />
        </HeroReveal>
      </div>
    </section>
  );
}
