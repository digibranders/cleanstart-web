import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroReveal } from '@/components/ui/Reveal';

/*
 * Telecom hero: the site's standard solution-page hero shell (FinanceHero,
 * FipsHero): bg-cs-hero mesh, gridline overlay, left-aligned copy, a 3D
 * artifact on the right and a bottom fade into the white section below.
 * Headline and button label are the brief's, verbatim.
 *
 * The artifact (cell tower, verified shield, rack servers, dish) was rendered
 * on flat black and keyed to a real alpha channel, so it composites straight
 * onto the gradient with no blend mode. It is decorative and not the LCP
 * element (the H1 carries `lcp`), and it is `hidden xl:block`, so it is not
 * `priority`: a priority preload would fire on phones that never paint it.
 */
export function TelecomHero(): React.ReactElement {
  return (
    <section
      data-section="TelecomHero"
      className="relative overflow-hidden bg-cs-hero md:min-h-[clamp(600px,44vw,660px)]"
    >
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
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none xl:block"
        style={{ maxWidth: 'var(--container-default)', height: '100%' }}
      >
        <div
          className="absolute"
          style={{
            // Same 40px inset the copy column is padded by, so the render ends
            // on the text's mirror line instead of hanging past the grid.
            // Centred a little below the band's midline so the tower's radio
            // rings clear the header at every xl height.
            right: '56px',
            top: 'calc(50% + 28px)',
            transform: 'translateY(-50%)',
            width: 'clamp(400px, 33vw, 500px)',
            aspectRatio: '730 / 759',
          }}
        >
          <Image
            src="/images/telecom/hero-telecom-network-v2.webp"
            alt="A telecom cell tower, rack servers and a satellite dish grouped around a verified security shield"
            fill
            sizes="(min-width: 1520px) 500px, 33vw"
            className="object-contain"
          />
        </div>
      </div>

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
        className="relative mx-auto flex max-w-[var(--container-default)] flex-col justify-center px-6 sm:px-10 md:min-h-[clamp(600px,44vw,660px)]"
        style={{
          paddingTop: 'calc(clamp(104px, 11vw, 168px) + var(--cs-header-extra))',
          paddingBottom: 'clamp(56px, 6vw, 96px)',
        }}
      >
        <div className="relative flex max-w-[700px] flex-col items-center text-center md:items-start md:text-left xl:max-w-[clamp(580px,48vw,670px)]">
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-display)',
                fontWeight: 600,
                letterSpacing: 'var(--text-hero-product-ls, -0.04em)',
                lineHeight: 'var(--text-hero-lh, 1.05)',
                marginBottom: 'clamp(24px, 2.5vw, 36px)',
              }}
            >
              Telecom Networks Run on Software.{' '}
              <span className="cs-text-gradient-impact">Security Must Keep Up.</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <Link
              href="/contact-us"
              className="cs-btn-blue"
              style={
                {
                  '--cs-btn-h': '44px',
                  '--cs-btn-px': '24px',
                  '--cs-btn-fs': '16px',
                } as React.CSSProperties
              }
            >
              <span>Talk to a Security Expert</span>
            </Link>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
