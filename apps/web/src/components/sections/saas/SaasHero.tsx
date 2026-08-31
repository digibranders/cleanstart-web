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
 * The artifact is commissioned for this page, not borrowed: an application panel
 * with a steadily rising chart, seated on a layered platform.
 *
 * It faces LOWER-LEFT on purpose. The render is pinned to the right of the
 * viewport with the headline and CTA on the left, so a subject facing right
 * would point the reader off the edge of the page; facing left, it turns back
 * into the copy.
 *
 * Rendered deliberately WITHOUT motion streaks. Three attempts at generating
 * them produced trails that fired out of the panel edge like beams or ran the
 * wrong way relative to the implied travel, because the generator has no model
 * of which way the object is going. If motion is wanted, it belongs in CSS
 * behind this image, where direction and colour are a one-line change.
 *
 * Rendered on white and matted afterwards — the generator ignores requests for
 * a transparent background, and a threshold knockout leaves white fringing on
 * the soft shadow. Corners confirmed 0,0,0,0, so it composites straight onto
 * the gradient with no blend mode.
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

      {/* Deliberately NOT `priority`. Next emits a `<link rel=preload as=image>`
          for a priority image with no `media` attribute, but this wrapper is
          `hidden xl:block`, so every phone and tablet was preloading a hero it
          never paints. It is also decorative (aria-hidden) and is not the LCP
          element: the H1 below carries the `lcp` prop for that. Without
          `priority` it still loads promptly at xl, because a lazy image already
          inside the viewport is fetched immediately. */}
      {/* Hero artifact, pinned right and only at xl+. Below 1280px there is no
          width that holds both the render and the headline without one of them
          being squeezed, and shrinking the render past its floor turns the
          panel's UI detail into noise. Same "hide it when there is no room"
          call the sibling hero makes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden select-none xl:block"
        style={{ maxWidth: 'var(--container-default)', height: '100%' }}
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
            // left a 352px hole in the middle of the composition and the render
            // had no weight to answer the copy with.
            //
            // Measured at 1440: hero 627 tall, header bottom at 73, bottom fade
            // starting at 427. 580px puts the render at 531 tall spanning
            // 35..567 — the top tucks under the nav by 38px and the platform
            // grounds into the fade, both of which read as intentional depth.
            // Past ~600px the panel climbs far enough to collide with the logo
            // row, which does not.
            top: '48%',
            transform: 'translateY(-50%)',
            width: 'clamp(430px, 40vw, 580px)',
            aspectRatio: '1234 / 1130',
          }}
        >
          <Image
            src="/images/saas/hero-app-platform.webp"
            alt="A SaaS application dashboard showing a steadily rising chart, seated on a layered software platform with a further module sliding into its base"
            fill
            sizes="(min-width: 1440px) 540px, 38vw"
            className="object-contain"
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
