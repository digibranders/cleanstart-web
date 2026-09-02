import type React from 'react';
import Link from 'next/link';
import { SaasHeroAppSurface } from './SaasHeroAppSurface';
import { SaasHeroParallax } from './SaasHeroParallax';
import { HeroReveal } from '@/components/ui/Reveal';

/*
 * SaaS hero — the site's standard solution-page hero shell (FipsHero /
 * CisoHero): bg-cs-hero mesh, a gridline overlay, left-aligned copy, an
 * artifact on the right, and a bottom fade into the white section below. Copy
 * is the proposal's, verbatim.
 *
 * The artifact is the one departure from that shell. Every other hero on the
 * site carries a 3D render; this one is drawn in code
 * (SaasHeroAppSurface.tsx), because the render it replaced was rejected and
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

      {/* Hero artifact, pinned right, visible from md up. It is hidden on phones
          only: there is genuinely no room beside the headline at 375px, and the
          artifact is decorative, so it drops rather than stacking.

          It used to be xl+ (1280px), which left anyone on a 1024-1279px window
          looking at an empty right half. Making it work at those widths means
          scaling the artifact AND capping the copy column, since both are
          competing for the same row.

          Built, not rendered: this was hero-app-platform.webp until the client
          rejected it. See SaasHeroAppSurface.tsx for the reasoning. There is no
          `priority` preload left to get wrong — the old render was preloading on
          phones that never painted it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none md:block"
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
            // Was a flat 40px, mirroring the copy's left padding. That looked
            // right on paper but not on screen: the headline is short, so its
            // text ended at 533 while the artifact began at 844 — a 310px hole
            // in the middle against a 40px margin on the right. Pulling the
            // artifact off the edge trades some of that hole for a right margin
            // that is still smaller than the gap it closes.
            right: 'clamp(24px, 4.5vw, 76px)',
            // Retuned for the two-line headline. The previous 44% / 540px pair
            // was fitted to a three-line one; against the shorter headline it
            // left a 352px hole in the middle of the composition and the
            // artifact had no weight to answer the copy with.
            top: '46%',
            transform: 'translateY(-50%)',
            // Scales with the viewport now that it renders from md up. Widened
            // from 38vw/560 because the drawing itself was mostly padding; with
            // the frame filled, a bigger box puts real content closer to the
            // copy instead of more empty space. Pure geometry with no type in
            // it, so it survives scaling in a way the earlier caption-bearing
            // versions would not have.
            width: 'clamp(280px, 42vw, 600px)',
          }}
        >
          <SaasHeroParallax>
            <SaasHeroAppSurface />
          </SaasHeroParallax>
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
        {/* The copy column has to yield room to the artifact from md up, or the
            two overlap. The calc subtracts the artifact's own width and a 56px
            gap from the padded container, so the budget tracks the artifact
            automatically instead of being re-guessed per breakpoint.

            100% of the container, NOT 100vw: vw includes the scrollbar, which
            handed the copy 15px it did not have and left a 24px gap to the
            artifact at 1030px. The xl rule stays as the tighter cap above
            1280. */}
        <div className="relative flex max-w-[760px] flex-col items-center text-center md:max-w-[calc(100%-clamp(280px,42vw,600px)-48px)] md:items-start md:text-left xl:max-w-[clamp(560px,46vw,690px)]">
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
              {/* Client's headline, replacing the SEO team's "Container Security
                  for SaaS Companies". The title tag still carries that phrase, so
                  the page keeps the keyword in the SERP; the H1 no longer
                  contains it. Same trade the financial services page made, and
                  the same parallel construction.

                  Each sentence gets its own block, because left to wrap
                  naturally the break landed mid-clause — "Move Faster. Security"
                  on one line — which destroys the parallel the headline is built
                  on. Same treatment FinanceStack's heading uses; not a <br>. */}
              <span className="block">Applications Move Faster.</span>
              <span className="block cs-text-gradient-impact">Security Must Be Smarter.</span>
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
