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

      {/* Commissioned hero artifact (v3): a financial analytics dashboard with
          a magnifying glass inspecting a verified, shielded container. Ships a
          real alpha channel (confirmed 0,0,0,0 at all four corners), so it
          composites straight onto the gradient — no blend mode, and none of the
          stacking-context care a screen-blended version needed. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none xl:block"
        style={{ maxWidth: 'var(--container-default)', height: '100%' }}
      >
        <div
          className="absolute right-0"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(480px, 46vw, 700px)',
            aspectRatio: '1300 / 833',
          }}
        >
          <Image
            src="/images/financial-services/hero-verified-dashboard-v3.webp"
            alt="A financial analytics dashboard with a magnifying glass inspecting a verified, shielded software container"
            fill
            sizes="(min-width: 1440px) 700px, 46vw"
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
          // The hero artifact is pinned absolute-right and only appears at
          // xl+ (1280px) — not lg — because 1024–1279px genuinely has no
          // width that fits both the image AND a 3-line headline; measured
          // directly, that range needs ≥520px of text column to hold 3 lines
          // at this font size, while the image's own floor width leaves at
          // most ~500px before the two touch. Rather than fight that dead
          // zone with a clamp, the image simply doesn't render there (same
          // "hide when there's no room" call already made for mobile), so the
          // full 700px column is safe for the whole sub-xl range. At xl+
          // clamp(580px, 48vw, 670px) is fit to the image's own measured
          // left edge at each width (with a margin), verified empirically at
          // 1280/1366/1440/1536/1920 for both zero overlap and a 3-line wrap.
          className="relative flex max-w-[700px] flex-col items-center text-center md:items-start md:text-left xl:max-w-[clamp(580px,48vw,670px)]"
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
                marginBottom: 'clamp(24px, 2.5vw, 36px)',
              }}
            >
              Financial Institutions Are Moving Faster.{' '}
              <span className="cs-text-gradient-impact">Security Can&apos;t Fall Behind.</span>
            </h1>
          </HeroReveal>

          <HeroReveal
            y={30}
            delay={0.2}
            duration={0.8}
            className="flex flex-col items-center sm:flex-row md:items-start"
          >
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

        {/* No hero artifact below xl — the dashboard reads as fine detail
            (charts, icons, list rows) that goes illegible at phone width, and
            1024–1279px has no room for the image alongside a 3-line headline
            regardless (see the text column's own comment). The desktop
            instance is already `hidden xl:block`, so this is the whole story
            rather than a duplicate copy at narrower breakpoints. */}
      </div>
    </section>
  );
}
