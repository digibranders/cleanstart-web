/**
 * Attack Surface Reduction CTA card — Figma node 783:1295 (desktop) / 366:6432 (mobile).
 *
 * White card with two lavender (#DF9BFF) corner blur-ellipses for ambient
 * glow, a subtle decorative grid in the background, and a bright blue
 * primary CTA. Rendered inside the Footer's 1276×330 slot via
 * `<Footer cta={<ASRCTA />} />`.
 *
 * Mobile: single-column layout with bird mascot below button.
 */

import Image from 'next/image';
import Link from 'next/link';

export function ASRCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ borderRadius: 'inherit' }}
    >
      {/* Union — decorative grid-of-squares pattern (desktop only — too wide for mobile) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/union-pattern.svg"
        alt=""
        className="pointer-events-none absolute select-none hidden sm:block"
        style={{
          left: 'clamp(200px, 38vw, 547px)',
          top: '-220px',
          width: '1101px',
          height: '1101px',
          maxWidth: 'none',
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
        draggable={false}
      />

      {/* Top-left lavender ellipse */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '-139px',
          top: '-168px',
          width: 'clamp(160px, 22vw, 320px)',
          height: 'clamp(160px, 22vw, 320px)',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(80px)',
        }}
      />

      {/* Bottom-right lavender ellipse */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: '-80px',
          bottom: '-120px',
          width: 'clamp(200px, 28vw, 511px)',
          height: 'clamp(200px, 28vw, 511px)',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(80px)',
        }}
      />

      {/* Content — desktop: row, mobile: centered column */}
      <div
        className="relative flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left"
        style={{
          padding: 'clamp(36px, 6vw, 64px) clamp(24px, 5vw, 80px)',
          gap: 'clamp(24px, 5vw, 72px)',
        }}
      >
        {/* Headline */}
        <p
          className="relative"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 3.1vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#111111',
            maxWidth: 'min(420px, 100%)',
            textWrap: 'balance',
            zIndex: 1,
          }}
        >
          Reduce Attack Surface At The Source
        </p>

        {/* Description + CTA + bird (mobile) */}
        <div
          className="relative flex flex-col items-center lg:items-start"
          style={{ gap: 'clamp(16px, 2vw, 28px)', zIndex: 1, maxWidth: 'min(460px, 100%)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(16px, 1.5vw, 20px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: '#111111',
              opacity: 0.8,
            }}
          >
            Build with only what production needs.
          </p>

          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 text-white transition-transform duration-200 hover:-translate-y-px"
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)',
              boxShadow:
                '0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px #3960F9',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Attack Surface Reduction</span>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M3 9h11m0 0l-4-4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* Bird mascot — visible on mobile only */}
          <div className="block lg:hidden mt-2">
            <Image
              src="/images/attack-surface-reduction/cta-bird-new.png"
              alt=""
              aria-hidden
              width={120}
              height={120}
              className="object-contain pointer-events-none select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
