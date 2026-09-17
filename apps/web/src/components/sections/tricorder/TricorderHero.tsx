import Image from 'next/image';
import Link from 'next/link';

import { HeroReveal } from '@/components/ui/Reveal';

/**
 * Tricorder hero, on the solution-page hero shell (FinanceHero / SaasHero):
 * bg-cs-hero mesh, gridline overlay, left-aligned copy with the gradient
 * accent, a 3D artifact on the right and a fade into the white section below.
 *
 * The artifact is the copy doc's own hero concept: the intelligence brain in a
 * glass cube on a pedestal. The render was produced on black and matted to a
 * real alpha channel, so it composites straight onto the gradient.
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
        className="relative mx-auto grid max-w-[var(--container-default)] items-center gap-8 px-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10"
        style={{
          paddingTop: 'calc(clamp(104px, 10vw, 150px) + var(--cs-header-extra))',
          paddingBottom: 'clamp(96px, 9vw, 150px)',
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
              <span className="cs-text-gradient-impact">for Software Trust</span>
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
          className="mx-auto w-full max-w-[560px] lg:max-w-[640px]"
        >
          <div className="relative w-full" style={{ aspectRatio: '1300 / 975' }}>
            {/* Halo, so the render sits in light rather than on flat navy. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[6%] rounded-full select-none"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(90,110,255,0.38) 0%, rgba(90,110,255,0) 72%)',
                filter: 'blur(24px)',
              }}
            />
            <div className="cs-tri-float absolute inset-0">
              <Image
                src="/images/tricorder/hero-intelligence-cube.webp"
                alt="A glowing glass cube holding a circuit-trace brain on a glass pedestal, surrounded by floating security panels"
                fill
                priority
                sizes="(min-width: 1440px) 640px, (min-width: 1024px) 45vw, 560px"
                className="select-none object-contain"
                draggable={false}
              />
            </div>
          </div>
        </HeroReveal>
      </div>
    </section>
  );
}
