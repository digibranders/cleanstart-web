import type React from 'react';
import Link from 'next/link';
import { HeroReveal } from '@/components/ui/Reveal';
import { PqcHeroArt } from './PqcHeroArt';

/*
 * Post-quantum hero: the site's standard solution-page hero shell (TelecomHero,
 * FipsHero): bg-cs-hero mesh, gridline overlay, left-aligned copy, a 3D artifact
 * on the right and a bottom fade into the white band below.
 *
 * Unlike the telecom hero the artifact is not hidden on phones: it drops in
 * below the button at a smaller size, so the first screen on a phone still has
 * the page's one visual. The H1 carries `lcp`; the padlock is the first visible
 * image on every screen, so it loads eagerly at high priority instead of waiting
 * on the default lazy-load.
 *
 * Headline, supporting line and button label are the brief's, verbatim.
 */
export function PqcHero(): React.ReactElement {
  return (
    <section
      data-section="PqcHero"
      className="relative overflow-hidden bg-cs-hero md:min-h-[clamp(620px,45vw,680px)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-0 hidden w-full select-none md:block"
        style={{ height: '640px', objectFit: 'cover', opacity: 0.7 }}
        loading="eager"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 select-none md:h-[200px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)',
        }}
      />

      <div
        className="relative mx-auto flex max-w-[var(--container-default)] flex-col justify-center px-6 sm:px-10 md:min-h-[clamp(620px,45vw,680px)]"
        style={{
          paddingTop: 'calc(clamp(104px, 11vw, 168px) + var(--cs-header-extra))',
          paddingBottom: 'clamp(72px, 7vw, 104px)',
        }}
      >
        <div className="relative flex max-w-[640px] flex-col items-center text-center md:items-start md:text-left lg:max-w-[min(640px,calc(100%-clamp(400px,37vw,560px)-24px))]">
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-display)',
                fontWeight: 600,
                letterSpacing: 'var(--text-hero-product-ls, -0.04em)',
                lineHeight: 'var(--text-hero-lh, 1.05)',
                marginBottom: 'clamp(18px, 2vw, 28px)',
              }}
            >
              The Post-Quantum Era{' '}
              <span
                className="cs-text-gradient-impact block"
                style={{ fontSize: '0.9em', fontWeight: 400 }}
              >
                Starts Here.
              </span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              style={{
                margin: '0 0 clamp(24px, 2.5vw, 36px)',
                maxWidth: '30em',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Build on hardened, verifiable software foundations for the next generation of
              cryptography.
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.25} duration={0.8}>
            <Link
              href="/cleanstart-images"
              className="cs-btn-blue"
              style={
                {
                  '--cs-btn-h': '44px',
                  '--cs-btn-px': '24px',
                  '--cs-btn-fs': '16px',
                } as React.CSSProperties
              }
            >
              <span>Explore Clean Images</span>
            </Link>
          </HeroReveal>
        </div>

        <PqcHeroArt className="mx-auto mt-10 w-[min(74vw,340px)] md:w-[min(56vw,420px)] lg:pointer-events-none lg:absolute lg:right-10 lg:top-[calc(50%+16px)] lg:mt-0 lg:w-[clamp(400px,37vw,560px)] lg:-translate-y-1/2" />
      </div>
    </section>
  );
}
