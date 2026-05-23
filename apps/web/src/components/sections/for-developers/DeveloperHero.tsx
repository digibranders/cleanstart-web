import Link from 'next/link';
import type React from 'react';

/*
 * Figma node 732-413 — Developer page hero (1920×937px)
 *
 * Background: --bg-hero-mesh gradient + grid overlay (.bg-cs-hero .bg-cs-grid)
 * Content block: centered, paddingTop 203px (below fixed nav)
 * H1: "Trusted Container Foundations"
 *   80px Manrope SemiBold, white, tracking -4px (-0.05em), lineHeight 1
 * Subtitle: "Minimal, hardened, verifiable container images that fit directly
 *   into existing developer workflows."
 *   30px Sora Regular, white 80% opacity, tracking -1.2px (-0.04em), lh 1.4
 *   max-width fits inside the 840px content column
 * CTA: "Explore CleanStart Images" — single .cs-btn-glass, 20px Manrope Medium
 *
 * Logo strip (bottom of hero, top-[689px] in Figma):
 *   Label: "Images for Popular Developer Stacks"
 *     19px Manrope Regular, white, tracking -0.57px, lh 1.1
 *   7 logos at exactly 40px height, exact Figma widths, ~80px gap between them
 *     Python 135px · Node.js 117px · Redis 132px · MongoDB 137px · NGINX 115px
 *     Java 68px · PostgreSQL 102px
 *   Continuous RTL scroll: .cs-marquee at 35s linear infinite
 *   Edge fades: mask-image gradient — transparent 0%, black 12%, black 88%, transparent 100%
 *   Purple fade-stops match section bg (rgb(61,30,183))
 */

interface LogoDef {
  src: string;
  alt: string;
  /** Figma-exact width in px — sets the <img> container so spacing is pixel-perfect */
  w: number;
}

const LOGOS: LogoDef[] = [
  { src: '/images/for-developers/logo-python.svg',     alt: 'Python',     w: 135 },
  { src: '/images/for-developers/logo-nodejs.svg',     alt: 'Node.js',    w: 117 },
  { src: '/images/for-developers/logo-redis.svg',      alt: 'Redis',      w: 132 },
  { src: '/images/for-developers/logo-mongodb.svg',    alt: 'MongoDB',    w: 137 },
  { src: '/images/for-developers/logo-nginx.svg',      alt: 'NGINX',      w: 115 },
  { src: '/images/for-developers/logo-java.svg',       alt: 'Java',       w: 68  },
  { src: '/images/for-developers/logo-postgresql.svg', alt: 'PostgreSQL', w: 102 },
];

/** Single logo item — plain img for marquee decorative logos (40 px tall, exact Figma width) */
function LogoItem({ src, alt, w }: LogoDef): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={w}
      height={40}
      loading="eager"
      decoding="async"
      className="shrink-0 object-contain"
      style={{
        height: '40px',
        width: `${w}px`,
        display: 'block',
        /* Convert brand-coloured SVGs to white for the dark hero background */
        filter: 'brightness(0) invert(1)',
        opacity: 0.85,
      }}
    />
  );
}

export function DeveloperHero(): React.ReactElement {

  return (
    <section
      data-section="DeveloperHero"
      className="relative overflow-hidden bg-cs-hero bg-cs-grid"
      style={{ minHeight: '760px' }}
    >
      {/* Bottom fade — blends hero into white WhyItMatters section */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: '160px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)',
        }}
      />

      {/* ── Content column ── */}
      <div
        className="relative mx-auto z-[2] flex w-full max-w-[840px] flex-col items-center px-6 sm:px-10 text-center"
        style={{ paddingTop: '203px' }}
      >
        {/* H1 — exact Figma: 80px SemiBold, tracking -4px */}
        <h1
          className="text-white"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 4.45vw, 64px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: '32px',
          }}
        >
          Trusted Container Foundations
        </h1>

        {/* Subtitle — Vuln spec body-lg */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(18px, 1.7vw, 24px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: '640px',
            marginBottom: '32px',
          }}
        >
          Minimal, hardened, verifiable container images that fit directly into existing developer
          workflows.
        </p>

        {/* CTA — single glass button matching Figma "Explore CleanStart Images" */}
        <Link
          href="/cleanstart-images"
          className="cs-btn-glass"
          style={
            {
              '--cs-btn-fs': '20px',
              '--cs-btn-h': '44px',
              '--cs-btn-px': '18px',
            } as React.CSSProperties
          }
        >
          Explore CleanStart Images
        </Link>
      </div>

      {/* ── Logo marquee strip ── */}
      <div
        className="relative mx-auto z-[2] flex flex-col items-center overflow-hidden"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: '0',
          paddingRight: '0',
          paddingTop: '56px',
          paddingBottom: '80px',
        }}
      >
        {/* Label — exact Figma: 19px Manrope Regular, white, tracking -0.57px */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '19px',
            fontWeight: 400,
            letterSpacing: '-0.57px',
            lineHeight: 1.1,
            color: '#ffffff',
            marginBottom: '32px',
          }}
        >
          Images for Popular Developer Stacks
        </p>

        {/* Marquee track — mask fades both edges (156px fade ~12% of 1276px container) */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          {/*
           * Seamless loop technique:
           * Two identical sets wrapped in sibling divs. Each set includes
           * paddingRight: 80px so its total width = logos + (n-1)×gap + trailing-gap.
           * The animation shifts -50% of the combined track, which equals exactly
           * one set's width → perfect loop with no visual jump.
           * animationPlayState: 'running' overrides the .cs-marquee:hover pause rule
           * so the scroll is always continuous.
           */}
          <div
            className="cs-marquee"
            style={{ animationDuration: '35s', animationPlayState: 'running' }}
          >
            {/* Set A */}
            <div className="flex shrink-0 items-center" style={{ gap: '80px', paddingRight: '80px' }}>
              {LOGOS.map((logo) => (
                <LogoItem key={`a-${logo.alt}`} src={logo.src} alt={logo.alt} w={logo.w} />
              ))}
            </div>
            {/* Set B — exact duplicate; -50% lands on this set's start = seamless */}
            <div className="flex shrink-0 items-center" style={{ gap: '80px', paddingRight: '80px' }}>
              {LOGOS.map((logo) => (
                <LogoItem key={`b-${logo.alt}`} src={logo.src} alt={logo.alt} w={logo.w} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
