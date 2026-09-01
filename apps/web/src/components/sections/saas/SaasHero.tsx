import type React from 'react';
import Link from 'next/link';
import { SaasHeroVerifiedRuntime } from './SaasHeroVerifiedRuntime';
import { HeroReveal } from '@/components/ui/Reveal';

/*
 * SaaS hero — the site's standard solution-page hero shell (FipsHero /
 * CisoHero): bg-cs-hero mesh, a gridline overlay, left-aligned copy, an
 * artifact on the right, and a bottom fade into the white section below. Copy
 * is the proposal's, verbatim.
 *
 * The artifact is the one departure from that shell. Every other hero on the
 * site carries a 3D render; this one is drawn in code
 * (SaasHeroVerifiedRuntime.tsx), because the render it replaced was rejected and
 * regenerating it kept landing on stock illustration.
 */
export function SaasHero(): React.ReactElement {
  return (
    <section
      data-section="SaasHero"
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

      {/* Hero artifact, pinned right and only at xl+. Below 1280px there is no
          width that holds both the artifact and the headline without one of them
          being squeezed. Same "hide it when there is no room" call the sibling
          hero makes.

          Built, not rendered: this was hero-app-platform.webp until the client
          rejected it. See SaasHeroVerifiedRuntime.tsx for the reasoning. There is no
          `priority` preload left to get wrong — the old render was preloading on
          phones that never painted it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none xl:block"
        style={{
          maxWidth: 'var(--container-default)',
          height: '100%',
          // Above the bottom fade, which is a later sibling and was painting
          // white over the panel's lower third. The old 3D render wanted that
          // wash — it read as the object grounding into the page — but a product
          // UI panel with its edges dissolving just looks broken.
          zIndex: 1,
        }}
      >
        <div
          className="absolute"
          style={{
            // Inset to the SAME 40px the content column is padded by, not
            // `right-0`. The wrapper is capped at --container-default while the
            // copy sits inside px-10, so right-0 hung the render 40px past the
            // text's mirror line and it read as escaping the grid.
            right: '40px',
            // Retuned for the two-line headline. The previous 44% / 540px pair
            // was fitted to a three-line one; against the shorter headline it
            // left a 352px hole in the middle of the composition and the
            // artifact had no weight to answer the copy with.
            top: '46%',
            transform: 'translateY(-50%)',
            // A deliberately narrow clamp. The artifact carries 10px labels, so
            // a wide range would scale that type off its own ramp — but across
            // 520..560 the labels only move 10.0px to 10.8px, which is nothing.
            // Fixing it at 560 instead left just 43px between the artifact and
            // the headline at 1280; this restores 83px there and keeps the full
            // size from 1440 up.
            width: 'clamp(520px, 40vw, 560px)',
          }}
        >
          <SaasHeroVerifiedRuntime />
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
        {/* Below xl the artifact does not render, so the column runs to its own
            measure. At xl+ the budget is fitted to the artifact's measured left
            edge at each width, with a margin. */}
        <div className="relative flex max-w-[760px] flex-col items-center text-center md:items-start md:text-left xl:max-w-[clamp(560px,46vw,690px)]">
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
              {/* The SEO team's H1, verbatim. The gradient splits the phrase
                  rather than adding words, so the rendered text is exactly
                  "Container Security for SaaS Companies". */}
              Container Security for{' '}
              <span className="cs-text-gradient-impact">SaaS Companies</span>
            </h1>
          </HeroReveal>

          <HeroReveal
            y={30}
            delay={0.2}
            duration={0.8}
            className="flex flex-col items-center sm:flex-row md:items-start"
          >
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
              <span>Talk to an Expert</span>
            </Link>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
