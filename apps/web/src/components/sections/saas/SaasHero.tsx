import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroReveal } from '@/components/ui/Reveal';

/*
 * SaaS hero — the site's standard solution-page hero shell (FipsHero /
 * CisoHero): bg-cs-hero mesh, a gridline overlay, left-aligned copy, a 3D
 * artifact on the right, and a bottom fade into the white section below. Copy
 * is the proposal's, verbatim.
 *
 * The artifact is commissioned for this page, not borrowed: a SaaS application
 * panel riding a rail above a foundation of verified component blocks, with
 * motion trails behind it. It carries both halves of the headline — moving
 * faster, and the security keeping up underneath — rather than decorating them.
 *
 * It was rendered on white and matted afterwards. The generator ignored the
 * transparent-background request, and the motion trails fade out gradually, so
 * a threshold knockout would have clipped their tails and left white fringing;
 * a matting pass keeps them as genuine partial alpha. Corners confirmed
 * 0,0,0,0, so it composites straight onto the gradient with no blend mode.
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
          width that holds both the render and the headline without one of them
          being squeezed, and shrinking the render past its floor turns the
          shield marks on the component blocks into noise. Same "hide it when
          there is no room" call the sibling hero makes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none xl:block"
        style={{ maxWidth: 'var(--container-default)', height: '100%' }}
      >
        <div
          className="absolute right-0"
          style={{
            // Sits above centre rather than on it. The section's bottom fade is
            // 200px deep, and dead-centring the render pushes its rail and the
            // cyan glow under it into that wash — which is where the whole
            // composition lands. Lifting it keeps the rail clear of the fade
            // while the motion trails still bleed into it, which is the part
            // that benefits from softening.
            top: '44%',
            transform: 'translateY(-50%)',
            width: 'clamp(500px, 45vw, 660px)',
            aspectRatio: '1360 / 993',
          }}
        >
          <Image
            src="/images/saas/hero-verified-stack.webp"
            alt="A SaaS application dashboard moving forward above a foundation of verified software component blocks, each marked with a check shield"
            fill
            sizes="(min-width: 1440px) 660px, 45vw"
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
        {/* Below xl the artifact does not render, so the column runs to its own
            measure. At xl+ the budget is fitted to the render's measured left
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
              Modern Applications Move Faster.{' '}
              <span className="cs-text-gradient-impact">Security Must Keep Up.</span>
            </h1>
          </HeroReveal>

          <HeroReveal
            y={30}
            delay={0.2}
            duration={0.8}
            className="flex flex-col items-center gap-4 sm:flex-row md:items-start"
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

            {/* The proposal pairs the primary CTA with a "Video" button but
                names no asset for it. Pointed at the resource centre so the
                button resolves somewhere real rather than nowhere; repoint it
                at the video when the client supplies one. */}
            <Link
              href="/resource-center"
              className="cs-btn-glass"
              style={
                {
                  '--cs-btn-h': '44px',
                  '--cs-btn-px': '24px',
                  '--cs-btn-fs': '16px',
                } as React.CSSProperties
              }
            >
              <span>Video</span>
            </Link>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
